import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/task";

export const useTaskComments = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          author:profiles(id, full_name, avatar_url)
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Transform to match Comment interface
      const comments: Comment[] = (data || []).map((comment: any) => ({
        id: comment.id,
        author: comment.author ? {
          id: comment.author.id,
          full_name: comment.author.full_name,
          avatar_url: comment.author.avatar_url,
        } : null,
        content: comment.content,
        created_at: comment.created_at,
        task_id: comment.task_id,
        user_id: comment.user_id,
      }));

      return comments;
    },
    enabled: !!taskId,
  });
};
