import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";

export const useTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform to match Task interface
      const tasks: Task[] = (data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              name: task.assignee.full_name || task.assignee.email || "Unknown",
              avatar: task.assignee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee.email}`,
            }
          : null,
        dueDate: task.due_date,
        tags: task.tags || [],
        comments: [], // Comments will be fetched separately when task detail is opened
        projectId: task.project_id,
        createdAt: task.created_at,
      }));

      return tasks;
    },
  });
};
