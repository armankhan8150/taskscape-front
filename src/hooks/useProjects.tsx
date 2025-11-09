import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/task";

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch tasks to calculate counts
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, status, project_id");

      if (tasksError) throw tasksError;

      // Transform to match Project interface with task counts
      const projectsWithCounts: Project[] = (projects || []).map((project) => {
        const projectTasks = tasks?.filter((t) => t.project_id === project.id) || [];
        
        return {
          id: project.id,
          name: project.name,
          description: project.description || "",
          color: project.color || "#3b82f6",
          taskCounts: {
            todo: projectTasks.filter((t) => t.status === "todo").length,
            "in-progress": projectTasks.filter((t) => t.status === "in-progress").length,
            review: projectTasks.filter((t) => t.status === "review").length,
            done: projectTasks.filter((t) => t.status === "done").length,
          },
        };
      });

      return projectsWithCounts;
    },
  });
};
