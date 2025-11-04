export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  dueDate: string | null;
  tags: string[];
  comments: Comment[];
  projectId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  taskCounts: {
    todo: number;
    "in-progress": number;
    review: number;
    done: number;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}
