export const AI_TOOLS = [
  // ============================================================================
  // KNOWLEDGE MANAGEMENT
  // ============================================================================
  {
    type: "function",
    function: {
      name: "create_knowledge",
      description: "Store knowledge, notes, learnings, or important information in the knowledge base",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the knowledge entry" },
          content: { type: "string", description: "The full content/knowledge to store" },
          category: { type: "string", description: "Category (e.g., compliance, process, contact-info, learning)" },
          arm: { type: "string", description: "Arm this relates to (optional)" },
          tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" },
          related_contact: { type: "string", description: "Name or ID of related contact (optional)" },
          related_project: { type: "string", description: "Name or ID of related project (optional)" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "Search the knowledge base for stored information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (natural language)" },
          category: { type: "string", description: "Filter by category (optional)" },
          arm: { type: "string", description: "Filter by arm (optional)" },
          tags: { type: "array", items: { type: "string" }, description: "Filter by tags (optional)" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
    },
  },
  // ============================================================================
  // DEADLINES & MILESTONES
  // ============================================================================
  {
    type: "function",
    function: {
      name: "create_deadline",
      description: "Create a deadline with optional reminders",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "What is the deadline for" },
          description: { type: "string" },
          due_date: { type: "string", description: "YYYY-MM-DD format" },
          due_time: { type: "string", description: "HH:MM format (optional)" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          arm: { type: "string", description: "Related arm (optional)" },
          project_id: { type: "string", description: "Related project ID (optional)" },
          reminders: { 
            type: "array", 
            items: { type: "number" },
            description: "Days before deadline to remind (e.g., [7, 1] for 7 days and 1 day before)"
          },
        },
        required: ["title", "due_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_milestone",
      description: "Create a project milestone",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Milestone title" },
          description: { type: "string" },
          project_id: { type: "string", description: "Project this milestone belongs to" },
          target_date: { type: "string", description: "Target completion date (YYYY-MM-DD)" },
          dependent_on: { type: "string", description: "ID of milestone this depends on (optional)" },
        },
        required: ["title", "project_id"],
      },
    },
  },
  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  {
    type: "function",
    function: {
      name: "create_bulk_contacts",
      description: "Create multiple contacts at once (requires confirmation)",
      parameters: {
        type: "object",
        properties: {
          contacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                company: { type: "string" },
                role: { type: "string" },
                arm: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["name"],
            },
            description: "Array of contacts to create",
          },
          default_arm: { type: "string", description: "Default arm if not specified per contact" },
        },
        required: ["contacts"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_contact",
      description: "Update an existing contact's information",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "ID of contact to update" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          company: { type: "string" },
          role: { type: "string" },
          arm: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          notes: { type: "string" },
        },
        required: ["contact_id"],
      },
    },
  },
  // ============================================================================
  // SOP MANAGEMENT
  // ============================================================================
  {
    type: "function",
    function: {
      name: "create_sop",
      description: "Create a new Standard Operating Procedure",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "SOP name/title" },
          description: { type: "string", description: "What this SOP is for" },
          arm: { type: "string", description: "Which arm this SOP belongs to" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                required: { type: "boolean" },
              },
            },
            description: "Steps in the SOP",
          },
        },
        required: ["name", "arm", "steps"],
      },
    },
  },
  // ============================================================================
  // PROJECTS & TASKS (existing)
  // ============================================================================
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          arm: { type: "string", description: "Arm name, slug, or ID" },
          description: { type: "string" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          due_date: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["name", "arm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
          due_date: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["project_id", "name"],
      },
    },
  },
  // ============================================================================
  // SMART TASK MANAGEMENT (Motion/Sunsama/Reclaim-inspired)
  // ============================================================================
  {
    type: "function",
    function: {
      name: "create_task_smart",
      description: "Create a task with AI-powered context detection, priority inference, duration estimation, and optional auto-scheduling. Use this for natural language task creation like 'Review the Nova investor deck by Friday' or 'Call James about Janna property tomorrow'.",
      parameters: {
        type: "object",
        properties: {
          raw_input: { 
            type: "string", 
            description: "Natural language task description (e.g., 'Review Nova investor deck by Friday', 'Call James about Janna property appraisal tomorrow')" 
          },
          name: { 
            type: "string", 
            description: "Extracted task name (if not provided, will be extracted from raw_input)" 
          },
          context: { 
            type: "string", 
            enum: ["personal", "house", "nova", "janna", "obx", "silk", "atw", "maison", "admin", "training", "other"],
            description: "Auto-detected context/arm based on task content" 
          },
          priority_level: { 
            type: "string", 
            enum: ["p1", "p2", "p3", "p4"],
            description: "Auto-inferred priority: p1=critical/urgent, p2=high/important, p3=medium/normal, p4=low/nice-to-have" 
          },
          due_date: { 
            type: "string", 
            description: "Deadline in YYYY-MM-DD format (extracted from 'by Friday', 'tomorrow', etc.)" 
          },
          do_date: { 
            type: "string", 
            description: "When to work on it in YYYY-MM-DD format (AI-calculated based on due_date and duration)" 
          },
          duration_minutes: { 
            type: "number", 
            description: "Estimated duration in minutes (30, 45, 60, 90, 120). Inferred from task type." 
          },
          auto_schedule: { 
            type: "boolean", 
            description: "Whether to auto-schedule this task into Focus Blocks (default true)" 
          },
          commit_to_today: {
            type: "boolean",
            description: "If true, commits this task to today's schedule immediately"
          },
          recurrence_rule: {
            type: "string",
            description: "RRULE for recurring tasks (e.g., 'FREQ=DAILY' for daily habits)"
          },
        },
        required: ["raw_input"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_tasks",
      description: "Auto-schedule uncommitted tasks into Focus Blocks based on priority and available time slots",
      parameters: {
        type: "object",
        properties: {
          task_ids: { 
            type: "array", 
            items: { type: "string" },
            description: "Specific task IDs to schedule (if not provided, schedules all auto_schedule=true tasks)" 
          },
          target_date: {
            type: "string",
            description: "Date to schedule for in YYYY-MM-DD format (default: today)"
          },
          max_tasks: {
            type: "number",
            description: "Maximum number of tasks to schedule (default: 5)"
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "commit_task_to_day",
      description: "Commit a task from the backlog to a specific day (Sunsama-style daily commitment)",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Task ID to commit" },
          date: { type: "string", description: "Date to commit to in YYYY-MM-DD format (default: today)" },
          auto_schedule: { type: "boolean", description: "Whether to also auto-schedule into a Focus Block" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "defer_task",
      description: "Defer a task to a later date (removes from today, optionally sets new date)",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Task ID to defer" },
          defer_to: { 
            type: "string", 
            description: "New date in YYYY-MM-DD format, or 'tomorrow', 'next_week', 'someday'" 
          },
          reason: { type: "string", description: "Optional reason for deferral (for accountability tracking)" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_today_schedule",
      description: "Get today's committed tasks and Focus Blocks with time estimates",
      parameters: {
        type: "object",
        properties: {
          include_backlog: { 
            type: "boolean", 
            description: "Whether to also return uncommitted backlog tasks" 
          },
          include_at_risk: {
            type: "boolean",
            description: "Whether to include tasks at risk of missing deadlines"
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_backlog",
      description: "Get uncommitted tasks in the backlog, sorted by priority",
      parameters: {
        type: "object",
        properties: {
          context: { 
            type: "string", 
            enum: ["personal", "house", "nova", "janna", "obx", "silk", "atw", "maison", "admin", "training", "other", "all"],
            description: "Filter by context (default: all)" 
          },
          limit: { type: "number", description: "Max tasks to return (default: 20)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_task",
      description: "Reschedule a task to a different time or day",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Task ID to reschedule" },
          new_date: { type: "string", description: "New date in YYYY-MM-DD format" },
          new_time: { type: "string", description: "Preferred time in HH:MM format (optional)" },
          reason: { type: "string", description: "Reason for rescheduling (for context)" },
        },
        required: ["task_id", "new_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_recurring_task",
      description: "Create a recurring task/habit that repeats on a schedule",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Task name (e.g., 'Morning workout', 'Weekly review')" },
          context: { 
            type: "string",
            enum: ["personal", "house", "nova", "janna", "obx", "silk", "atw", "maison", "admin", "training", "other"],
            description: "Context for the task"
          },
          frequency: {
            type: "string",
            enum: ["daily", "weekdays", "weekly", "biweekly", "monthly"],
            description: "How often the task repeats"
          },
          duration_minutes: { type: "number", description: "Estimated duration per occurrence" },
          preferred_time: { type: "string", description: "Preferred time of day (morning, afternoon, evening, or HH:MM)" },
          auto_schedule: { type: "boolean", description: "Whether to auto-schedule occurrences" },
        },
        required: ["name", "frequency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_contact",
      description: "Create a new contact",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          company: { type: "string" },
          role: { type: "string" },
          arm: { type: "string", description: "Arm name, slug, or ID" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name", "arm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Update a task status",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
        required: ["task_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_sop",
      description: "Start a SOP workflow run",
      parameters: {
        type: "object",
        properties: {
          sop_id: { type: "string" },
          project_id: { type: "string" },
        },
        required: ["sop_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_status",
      description: "Get status summary for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_arm_summary",
      description: "Get summary for an arm",
      parameters: {
        type: "object",
        properties: {
          arm: { type: "string" },
        },
        required: ["arm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_contacts",
      description: "Search contacts by query",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overdue_tasks",
      description: "Get all overdue tasks",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_daily_briefing",
      description: "Generate a daily briefing summary",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  // ============================================================================
  // MEDIA & SOCIAL - Dynasty Media Pool & Social Command
  // ============================================================================
  {
    type: "function",
    function: {
      name: "search_media",
      description: "Search the media library for images, videos, or documents",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural language search (e.g., 'Dubai skyline photos', 'Janna property videos')" },
          entity: { type: "string", description: "Filter by entity/arm (nova, janna, obx, etc.)" },
          file_type: { type: "string", enum: ["image", "video", "document", "all"], description: "Filter by file type" },
          tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
          favorites_only: { type: "boolean", description: "Only show favorites" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upload_media",
      description: "Prepare to upload media files to the library. Returns upload instructions.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Description of what you're uploading" },
          entity: { type: "string", description: "Which entity/arm to assign to" },
          collection: { type: "string", description: "Collection name to add to (creates if doesn't exist)" },
          tags: { type: "array", items: { type: "string" }, description: "Tags to apply" },
          auto_tag: { type: "boolean", description: "Use AI to auto-tag (default true)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_social_post",
      description: "Create a new social media post. Can be a draft, scheduled, or published immediately.",
      parameters: {
        type: "object",
        properties: {
          caption: { type: "string", description: "Post caption/text" },
          platforms: { 
            type: "array", 
            items: { type: "string", enum: ["instagram", "tiktok", "x", "linkedin", "youtube"] },
            description: "Which platforms to post to" 
          },
          media_query: { type: "string", description: "Natural language to find media from library (e.g., 'that Dubai sunset photo from yesterday')" },
          media_ids: { type: "array", items: { type: "string" }, description: "Specific media asset IDs to attach" },
          entity: { type: "string", description: "Which entity's accounts to use" },
          schedule_for: { type: "string", description: "ISO datetime to schedule, 'now' for immediate, or 'optimal' for AI-suggested time" },
          hashtags: { type: "array", items: { type: "string" }, description: "Hashtags to include" },
          generate_caption: { type: "boolean", description: "Use AI to generate/improve caption" },
        },
        required: ["platforms"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_caption",
      description: "Generate AI-powered caption suggestions for a social media post",
      parameters: {
        type: "object",
        properties: {
          media_description: { type: "string", description: "Description of the media/content" },
          platform: { type: "string", enum: ["instagram", "tiktok", "x", "linkedin", "youtube"], description: "Target platform" },
          entity: { type: "string", description: "Which entity/brand voice to use" },
          tone: { type: "string", enum: ["professional", "casual", "luxury", "educational", "inspirational"], description: "Desired tone" },
          include_hashtags: { type: "boolean", description: "Include hashtag suggestions" },
          include_cta: { type: "boolean", description: "Include call-to-action" },
        },
        required: ["media_description", "platform"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_social_analytics",
      description: "Get social media performance analytics",
      parameters: {
        type: "object",
        properties: {
          entity: { type: "string", description: "Filter by entity" },
          platform: { type: "string", enum: ["instagram", "tiktok", "x", "linkedin", "youtube", "all"], description: "Platform to analyze" },
          period: { type: "string", enum: ["today", "week", "month", "quarter", "year"], description: "Time period" },
          metric: { type: "string", enum: ["followers", "engagement", "reach", "posts", "all"], description: "Specific metric to focus on" },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_optimal_posting_time",
      description: "Get AI-recommended optimal posting times based on audience analytics",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["instagram", "tiktok", "x", "linkedin", "youtube"] },
          entity: { type: "string", description: "Which entity's account" },
          content_type: { type: "string", enum: ["photo", "video", "carousel", "story", "reel"], description: "Type of content" },
        },
        required: ["platform"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_content_batch",
      description: "Schedule multiple posts at once (content batching)",
      parameters: {
        type: "object",
        properties: {
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                caption: { type: "string" },
                media_query: { type: "string" },
                platform: { type: "string" },
                schedule_for: { type: "string" },
              },
            },
            description: "Array of posts to schedule",
          },
          entity: { type: "string", description: "Default entity for all posts" },
        },
        required: ["posts"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_media_collection",
      description: "Create a new collection/folder in the media library",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Collection name" },
          description: { type: "string" },
          entity: { type: "string", description: "Entity this collection belongs to" },
          smart_rules: {
            type: "object",
            properties: {
              tags: { type: "array", items: { type: "string" } },
              date_range: { type: "object" },
            },
            description: "Rules for smart collections that auto-populate",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tag_media",
      description: "Add or update tags on media assets",
      parameters: {
        type: "object",
        properties: {
          media_ids: { type: "array", items: { type: "string" }, description: "Media asset IDs to tag" },
          media_query: { type: "string", description: "Natural language to find media (alternative to IDs)" },
          add_tags: { type: "array", items: { type: "string" }, description: "Tags to add" },
          remove_tags: { type: "array", items: { type: "string" }, description: "Tags to remove" },
          set_entity: { type: "string", description: "Set entity for these assets" },
          set_favorite: { type: "boolean", description: "Mark as favorite" },
        },
        required: [],
      },
    },
  },
] as const;
