import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, Profile } from "@/types/task";
import { Database } from "@/integrations/supabase/types";

// This is the shape of the data we get from Supabase
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  task_comments: [{ count: number }];
};

// This function transforms the raw Supabase row into our frontend Task type
const transformTask = (row: TaskRow): Task => {
  const assignee: Profile | null = row.profiles
    ? {
        id: row.profiles.id,
        full_name: row.profiles.full_name,
        avatar_url: row.profiles.avatar_url,
      }
    : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    project_id: row.project_id,
    due_date: row.due_date,
    tags: row.tags,
    created_at: row.created_at,
    assignee: assignee,
    comment_count: row.task_comments[0]?.count ?? 0,
  };
};

export const useTasks = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("tasks-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "*, profiles!tasks_assigned_to_fkey(*), task_comments(count)",
        );

      if (error) throw error;

      const tasks: Task[] = data.map(transformTask as any);
      return tasks;
    },
  });
};