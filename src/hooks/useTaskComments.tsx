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
          author:profiles!task_comments_user_id_fkey(full_name, email, avatar_url)
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Transform to match Comment interface
      const comments: Comment[] = (data || []).map((comment: any) => ({
        id: comment.id,
        author: comment.author?.full_name || comment.author?.email || "Unknown",
        content: comment.content,
        createdAt: comment.created_at,
      }));

      return comments;
    },
    enabled: !!taskId,
  });
};
