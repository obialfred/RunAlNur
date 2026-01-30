/**
 * ClickUp Setup Executor
 * 
 * Idempotently creates the House Al Nūr structure in ClickUp.
 * Safe to run multiple times - skips items that already exist.
 */

import { ClickUpClient, ClickUpFolder } from "@/lib/integrations/clickup";
import { HOUSE_AL_NUR_SPEC, SpaceSpec, FolderSpec, ListSpec } from "./house-al-nur-spec";
import { normalizeClickUpName } from "@/lib/clickup/normalize";

export interface SetupProgress {
  phase: "idle" | "fetching" | "creating_folders" | "creating_lists" | "creating_tasks" | "complete" | "error";
  message: string;
  created: {
    folders: number;
    lists: number;
    tasks: number;
  };
  skipped: {
    folders: number;
    lists: number;
    tasks: number;
  };
  errors: string[];
  currentSpace?: string;
  currentFolder?: string;
  currentList?: string;
}

export interface SetupResult {
  success: boolean;
  progress: SetupProgress;
  duration: number;
}

// Type for progress callback
type ProgressCallback = (progress: SetupProgress) => void;

/**
 * Check what structure exists vs what's missing
 */
export async function checkClickUpStructure(
  client: ClickUpClient,
  workspaceId: string
): Promise<{
  existing: {
    spaces: Map<string, string>; // name -> id
    folders: Map<string, Map<string, string>>; // spaceId -> (name -> id)
    lists: Map<string, Map<string, string>>; // folderId -> (name -> id)
  };
  missing: {
    folders: Array<{ spaceName: string; folderName: string }>;
    lists: Array<{ spaceName: string; folderName: string; listName: string }>;
  };
}> {
  const existing = {
    spaces: new Map<string, string>(),
    folders: new Map<string, Map<string, string>>(),
    lists: new Map<string, Map<string, string>>(),
  };
  
  const missing = {
    folders: [] as Array<{ spaceName: string; folderName: string }>,
    lists: [] as Array<{ spaceName: string; folderName: string; listName: string }>,
  };

  // Get all spaces
  const { spaces } = await client.getSpaces(workspaceId);
  for (const space of spaces) {
    existing.spaces.set(space.name, space.id);
    // also store normalized for fuzzy matching
    existing.spaces.set(normalizeClickUpName(space.name), space.id);
  }

  // For each space in spec, check folders and lists
  for (const spaceSpec of HOUSE_AL_NUR_SPEC) {
    const spaceId =
      existing.spaces.get(spaceSpec.name) ??
      existing.spaces.get(normalizeClickUpName(spaceSpec.name));
    if (!spaceId) continue; // Space doesn't exist, skip

    // Get folders for this space
    const { folders } = await client.getFolders(spaceId);
    const folderMap = new Map<string, string>();
    for (const folder of folders) {
      folderMap.set(folder.name, folder.id);
      folderMap.set(normalizeClickUpName(folder.name), folder.id);
    }
    existing.folders.set(spaceId, folderMap);

    // Check each folder in spec
    for (const folderSpec of spaceSpec.folders) {
      const folderId =
        folderMap.get(folderSpec.name) ??
        folderMap.get(normalizeClickUpName(folderSpec.name));
      
      if (!folderId) {
        missing.folders.push({
          spaceName: spaceSpec.name,
          folderName: folderSpec.name,
        });
        // All lists in this folder are also missing
        for (const listSpec of folderSpec.lists) {
          missing.lists.push({
            spaceName: spaceSpec.name,
            folderName: folderSpec.name,
            listName: listSpec.name,
          });
        }
      } else {
        // Folder exists, check lists
        const { lists } = await client.getLists(folderId);
        const listMap = new Map<string, string>();
        for (const list of lists) {
          listMap.set(list.name, list.id);
          listMap.set(normalizeClickUpName(list.name), list.id);
        }
        existing.lists.set(folderId, listMap);

        for (const listSpec of folderSpec.lists) {
          const key = normalizeClickUpName(listSpec.name);
          if (!listMap.has(listSpec.name) && !listMap.has(key)) {
            missing.lists.push({
              spaceName: spaceSpec.name,
              folderName: folderSpec.name,
              listName: listSpec.name,
            });
          }
        }
      }
    }
  }

  return { existing, missing };
}

/**
 * Execute the full setup - creates folders, lists, and seed tasks
 */
export async function executeClickUpSetup(
  client: ClickUpClient,
  workspaceId: string,
  onProgress?: ProgressCallback
): Promise<SetupResult> {
  const startTime = Date.now();
  
  const progress: SetupProgress = {
    phase: "fetching",
    message: "Fetching existing ClickUp structure...",
    created: { folders: 0, lists: 0, tasks: 0 },
    skipped: { folders: 0, lists: 0, tasks: 0 },
    errors: [],
  };
  
  const reportProgress = () => onProgress?.(progress);
  reportProgress();

  try {
    // Step 1: Get existing spaces
    const { spaces } = await client.getSpaces(workspaceId);
    const spaceMap = new Map<string, string>();
    for (const space of spaces) {
      spaceMap.set(space.name, space.id);
      spaceMap.set(normalizeClickUpName(space.name), space.id);
    }

    // Step 2: Process each space in spec
    progress.phase = "creating_folders";
    
    for (const spaceSpec of HOUSE_AL_NUR_SPEC) {
      progress.currentSpace = spaceSpec.name;
      progress.message = `Processing space: ${spaceSpec.name}`;
      reportProgress();

      const spaceId =
        spaceMap.get(spaceSpec.name) ??
        spaceMap.get(normalizeClickUpName(spaceSpec.name));
      if (!spaceId) {
        progress.errors.push(`Space not found: ${spaceSpec.name} - Please create it in ClickUp first`);
        continue;
      }

      // Get existing folders for this space
      const { folders: existingFolders } = await client.getFolders(spaceId);
      const folderMap = new Map<string, string>();
      for (const folder of existingFolders) {
        folderMap.set(folder.name, folder.id);
        folderMap.set(normalizeClickUpName(folder.name), folder.id);
      }

      // Create missing folders
      for (const folderSpec of spaceSpec.folders) {
        progress.currentFolder = folderSpec.name;
        
        let folderId =
          folderMap.get(folderSpec.name) ??
          folderMap.get(normalizeClickUpName(folderSpec.name));
        
        if (!folderId) {
          try {
            progress.message = `Creating folder: ${folderSpec.name}`;
            reportProgress();
            
            const newFolder = await client.createFolder(spaceId, folderSpec.name);
            folderId = newFolder.id;
            folderMap.set(folderSpec.name, folderId);
            folderMap.set(normalizeClickUpName(folderSpec.name), folderId);
            progress.created.folders++;
          } catch (err) {
            progress.errors.push(`Failed to create folder ${folderSpec.name}: ${err}`);
            continue;
          }
        } else {
          progress.skipped.folders++;
        }

        // Get existing lists in this folder
        progress.phase = "creating_lists";
        const { lists: existingLists } = await client.getLists(folderId);
        const listMap = new Map<string, string>();
        for (const list of existingLists) {
          listMap.set(list.name, list.id);
          listMap.set(normalizeClickUpName(list.name), list.id);
        }

        // Create missing lists
        for (const listSpec of folderSpec.lists) {
          progress.currentList = listSpec.name;
          
          let listId =
            listMap.get(listSpec.name) ??
            listMap.get(normalizeClickUpName(listSpec.name));
          
          if (!listId) {
            try {
              progress.message = `Creating list: ${listSpec.name}`;
              reportProgress();
              
              const newList = await client.createList(folderId, listSpec.name);
              listId = newList.id;
              listMap.set(listSpec.name, listId);
              listMap.set(normalizeClickUpName(listSpec.name), listId);
              progress.created.lists++;
            } catch (err) {
              progress.errors.push(`Failed to create list ${listSpec.name}: ${err}`);
              continue;
            }
          } else {
            progress.skipped.lists++;
          }

          // Create seed tasks
          if (listSpec.tasks.length > 0) {
            progress.phase = "creating_tasks";
            
            // Get existing tasks to avoid duplicates
            const { tasks: existingTasks } = await client.getTasks(listId, { include_closed: true });
            const taskNames = new Set(existingTasks.map(t => normalizeClickUpName(t.name)));

            for (const taskSpec of listSpec.tasks) {
              if (taskNames.has(normalizeClickUpName(taskSpec.name))) {
                progress.skipped.tasks++;
                continue;
              }

              try {
                progress.message = `Creating task: ${taskSpec.name}`;
                reportProgress();
                
                await client.createTask(listId, {
                  name: taskSpec.name,
                  description: taskSpec.description,
                  priority: taskSpec.priority,
                });
                progress.created.tasks++;
              } catch (err) {
                progress.errors.push(`Failed to create task ${taskSpec.name}: ${err}`);
              }
            }
          }
        }
      }
    }

    progress.phase = "complete";
    progress.message = "Setup complete!";
    progress.currentSpace = undefined;
    progress.currentFolder = undefined;
    progress.currentList = undefined;
    reportProgress();

    return {
      success: progress.errors.length === 0,
      progress,
      duration: Date.now() - startTime,
    };

  } catch (err) {
    progress.phase = "error";
    progress.message = `Setup failed: ${err}`;
    progress.errors.push(`Fatal error: ${err}`);
    reportProgress();

    return {
      success: false,
      progress,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get a summary of what would be created without actually creating anything
 */
export async function previewSetup(
  client: ClickUpClient,
  workspaceId: string
): Promise<{
  wouldCreate: {
    folders: string[];
    lists: string[];
    tasks: number;
  };
  alreadyExists: {
    folders: string[];
    lists: string[];
  };
  missingSpaces: string[];
}> {
  const result = {
    wouldCreate: {
      folders: [] as string[],
      lists: [] as string[],
      tasks: 0,
    },
    alreadyExists: {
      folders: [] as string[],
      lists: [] as string[],
    },
    missingSpaces: [] as string[],
  };

  // Get existing spaces
  const { spaces } = await client.getSpaces(workspaceId);
  const spaceMap = new Map<string, string>();
  for (const space of spaces) {
    spaceMap.set(space.name, space.id);
    spaceMap.set(normalizeClickUpName(space.name), space.id);
  }

  for (const spaceSpec of HOUSE_AL_NUR_SPEC) {
    const spaceId =
      spaceMap.get(spaceSpec.name) ??
      spaceMap.get(normalizeClickUpName(spaceSpec.name));
    if (!spaceId) {
      result.missingSpaces.push(spaceSpec.name);
      continue;
    }

    // Get existing folders
    const { folders: existingFolders } = await client.getFolders(spaceId);
    const folderMap = new Map<string, string>();
    for (const folder of existingFolders) {
      folderMap.set(folder.name, folder.id);
      folderMap.set(normalizeClickUpName(folder.name), folder.id);
    }

    for (const folderSpec of spaceSpec.folders) {
      const folderId =
        folderMap.get(folderSpec.name) ??
        folderMap.get(normalizeClickUpName(folderSpec.name));
      
      if (!folderId) {
        result.wouldCreate.folders.push(`${spaceSpec.name} / ${folderSpec.name}`);
        // All lists in this folder would be created
        for (const listSpec of folderSpec.lists) {
          result.wouldCreate.lists.push(`${spaceSpec.name} / ${folderSpec.name} / ${listSpec.name}`);
          result.wouldCreate.tasks += listSpec.tasks.length;
        }
      } else {
        result.alreadyExists.folders.push(`${spaceSpec.name} / ${folderSpec.name}`);
        
        // Check lists
        const { lists: existingLists } = await client.getLists(folderId);
        const listMap = new Map<string, string>();
        for (const list of existingLists) {
          listMap.set(list.name, list.id);
          listMap.set(normalizeClickUpName(list.name), list.id);
        }

        for (const listSpec of folderSpec.lists) {
          const listId =
            listMap.get(listSpec.name) ??
            listMap.get(normalizeClickUpName(listSpec.name));
          if (!listId) {
            result.wouldCreate.lists.push(`${spaceSpec.name} / ${folderSpec.name} / ${listSpec.name}`);
            result.wouldCreate.tasks += listSpec.tasks.length;
          } else {
            result.alreadyExists.lists.push(`${spaceSpec.name} / ${folderSpec.name} / ${listSpec.name}`);
            // Note: We don't check individual tasks in preview mode for speed
          }
        }
      }
    }
  }

  return result;
}
