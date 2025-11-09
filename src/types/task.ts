import { Database } from "@/integrations/supabase/types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

// A profile object, suitable for assignees or authors
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

// The main Task type, now aligned with our database query
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Profile | null; // This will be the joined profile
  due_date: string | null;
  tags: string[] | null;
  comment_count: number; // Replaces the comments array
  project_id: string;
  created_at: string;
}

// The Comment type, with a nested author profile
export interface Comment {
  id: string;
  author: Profile | null; // author is a joined profile
  content: string;
  created_at: string;
  task_id: string;
  user_id: string;
}

// The Project type, with calculated task counts
export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  taskCounts: {
    todo: number;
    "in-progress": number;
    review: number;
    done: number;
  };
}

// The TeamMember type, derived from the useTeamMembers hook
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}