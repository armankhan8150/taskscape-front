import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCommentMutations = () => {
  const queryClient = useQueryClient();

  const createComment = useMutation({
    mutationFn: async (data: { taskId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: comment, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: data.taskId,
          user_id: user.id,
          content: data.content,
        })
        .select()
        .single();

      if (error) throw error;
      return comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", variables.taskId] });
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add comment: " + error.message);
    },
  });

  return {
    createComment,
  };
};
