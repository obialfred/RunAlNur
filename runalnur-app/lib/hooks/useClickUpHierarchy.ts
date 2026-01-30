"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClickUpFolder, ClickUpList, ClickUpTask } from "@/lib/integrations/clickup";
import { CLICKUP_SPACE_MAP, ArmId } from "@/lib/constants";
import { normalizeClickUpName } from "@/lib/clickup/normalize";

interface ClickUpHierarchy {
  workspaceId: string | null;
  workspaceName: string | null;
  spaces: Array<{
    id: string;
    name: string;
    folders: Array<{
      id: string;
      name: string;
      lists: Array<{
        id: string;
        name: string;
        taskCount?: number;
      }>;
    }>;
  }>;
}

interface ClickUpHierarchyResult {
  data: ClickUpHierarchy | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to fetch the full ClickUp hierarchy for a workspace
 */
export function useClickUpHierarchy(): ClickUpHierarchyResult {
  const [data, setData] = useState<ClickUpHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get workspaces
      const workspacesRes = await fetch("/api/clickup?action=workspaces");
      const workspacesData = await workspacesRes.json();

      if (!workspacesData.success || !workspacesData.data?.length) {
        setData(null);
        setError("No ClickUp workspace found");
        setLoading(false);
        return;
      }

      const workspace = workspacesData.data[0];
      
      // Get spaces
      const spacesRes = await fetch(`/api/clickup?action=spaces&team_id=${workspace.id}`);
      const spacesData = await spacesRes.json();

      if (!spacesData.success) {
        setError(spacesData.error || "Failed to fetch spaces");
        setLoading(false);
        return;
      }

      // Build hierarchy
      const hierarchy: ClickUpHierarchy = {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        spaces: [],
      };

      // Fetch folders for each space
      for (const space of spacesData.data || []) {
        const foldersRes = await fetch(`/api/clickup?action=folders&space_id=${space.id}`);
        const foldersData = await foldersRes.json();

        const spaceEntry = {
          id: space.id,
          name: space.name,
          folders: [] as Array<{ id: string; name: string; lists: Array<{ id: string; name: string; taskCount?: number }> }>,
        };

        for (const folder of foldersData.data || []) {
          const listsRes = await fetch(`/api/clickup?action=lists&folder_id=${folder.id}`);
          const listsData = await listsRes.json();

          spaceEntry.folders.push({
            id: folder.id,
            name: folder.name,
            lists: (listsData.data || []).map((list: { id: string; name: string }) => ({
              id: list.id,
              name: list.name,
            })),
          });
        }

        hierarchy.spaces.push(spaceEntry);
      }

      setData(hierarchy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch hierarchy");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  return { data, loading, error, refresh: fetchHierarchy };
}

/**
 * Hook to fetch ClickUp data for a specific Arm
 */
export function useClickUpArm(armId: ArmId) {
  const [data, setData] = useState<{
    spaceId: string | null;
    spaceName: string | null;
    folders: Array<{
      id: string;
      name: string;
      lists: Array<{
        id: string;
        name: string;
      }>;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const spaceName = CLICKUP_SPACE_MAP[armId];

  const fetchArmData = useCallback(async () => {
    if (!spaceName) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get workspaces
      const workspacesRes = await fetch("/api/clickup?action=workspaces");
      const workspacesData = await workspacesRes.json();

      if (!workspacesData.success || !workspacesData.data?.length) {
        setData(null);
        setLoading(false);
        return;
      }

      const workspace = workspacesData.data[0];

      // Get spaces
      const spacesRes = await fetch(`/api/clickup?action=spaces&team_id=${workspace.id}`);
      const spacesData = await spacesRes.json();

      // Find matching space
      const wanted = normalizeClickUpName(spaceName);
      const space = spacesData.data?.find((s: { name: string }) => normalizeClickUpName(s.name) === wanted);
      if (!space) {
        setData(null);
        setLoading(false);
        return;
      }

      // Get folders
      const foldersRes = await fetch(`/api/clickup?action=folders&space_id=${space.id}`);
      const foldersData = await foldersRes.json();

      const folders = [];
      for (const folder of foldersData.data || []) {
        const listsRes = await fetch(`/api/clickup?action=lists&folder_id=${folder.id}`);
        const listsData = await listsRes.json();

        folders.push({
          id: folder.id,
          name: folder.name,
          lists: (listsData.data || []).map((list: { id: string; name: string }) => ({
            id: list.id,
            name: list.name,
          })),
        });
      }

      setData({
        spaceId: space.id,
        spaceName: space.name,
        folders,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ClickUp data");
    }

    setLoading(false);
  }, [spaceName]);

  useEffect(() => {
    fetchArmData();
  }, [fetchArmData]);

  return { data, loading, error, refresh: fetchArmData };
}

/**
 * Hook to fetch tasks for a specific ClickUp list
 */
export function useClickUpTasks(listId: string | null) {
  const [data, setData] = useState<ClickUpTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!listId) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clickup?action=tasks&list_id=${listId}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data || []);
      } else {
        setError(result.error || "Failed to fetch tasks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    }

    setLoading(false);
  }, [listId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { data, loading, error, refresh: fetchTasks };
}

/**
 * Hook to get tasks due today across all lists
 */
export function useClickUpTasksDueToday() {
  const [data, setData] = useState<Array<{
    id: string;
    name: string;
    status: string;
    listName: string;
    spaceName: string;
    dueDate?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDueTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, we'll need to fetch from multiple lists
      // In a real implementation, you'd use ClickUp's search/filter API
      // or maintain a local cache
      const res = await fetch("/api/clickup?action=status");
      const result = await res.json();

      if (!result.connected) {
        setData([]);
        setLoading(false);
        return;
      }

      // TODO: Implement actual due today fetch using ClickUp search API
      // For now, return empty - this would need backend support
      setData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDueTasks();
  }, [fetchDueTasks]);

  return { data, loading, error, refresh: fetchDueTasks };
}
