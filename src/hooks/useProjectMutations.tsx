import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProjectMutations = () => {
  const queryClient = useQueryClient();

  const createProject = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Create Project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description,
          created_by: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Attempt to link to a team (Find first team user is in)
      const { data: members } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (members) {
        await supabase
          .from("project_teams")
          .insert({ project_id: project.id, team_id: members.team_id });
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create project: " + error.message);
    },
  });

  return { createProject };
};
