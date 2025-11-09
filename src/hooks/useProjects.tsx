import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/task";
import { Database } from "@/integrations/supabase/types";

// Helper function to transform raw project data
const transformProject = (
  project: Database["public"]["Tables"]["projects"]["Row"],
): Omit<Project, "taskCounts"> => ({
  id: project.id,
  name: project.name,
  description: project.description,
  color: project.color,
});

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*");

      if (error) throw error;

      // Transform the data to match our frontend Project type (minus counts)
      const projects: Omit<Project, "taskCounts">[] = data.map(transformProject);
      return projects;
    },
  });
};