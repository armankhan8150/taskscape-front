import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  // Mutation for creating a new task
  const { mutate: createTask } = useMutation({
    mutationFn: async (
      task: Database["public"]["Tables"]["tasks"]["Insert"],
    ) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Task created successfully");
      invalidateTasks();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation for updating an existing task
  const { mutate: updateTask } = useMutation({
    mutationFn: async ({
      id,
      ...task
    }: Database["public"]["Tables"]["tasks"]["Update"] & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Task updated successfully");
      invalidateTasks();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { createTask, updateTask };
};