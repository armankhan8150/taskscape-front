import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { TeamSidebar } from "@/components/TeamSidebar";
import { Dashboard } from "@/components/Dashboard";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskDetailDrawer } from "@/components/TaskDetailDrawer";
import { QuickAddTask } from "@/components/QuickAddTask";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Task, TaskStatus, Project } from "@/types/task";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { Database } from "@/integrations/supabase/types";

type View = "dashboard" | "board";

const Index = () => {
  const [view, setView] = useState<View>("dashboard");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState<TaskStatus>("todo");

  // Fetch all live data from Supabase
  const { data: teamMembers = [], isLoading: isLoadingMembers } = useTeamMembers();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();

  // Get mutation functions
  const { createTask, updateTask } = useTaskMutations();

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setView("board");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedProject(null);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  // Connect task updates to the database
  const handleUpdateTask = (
    taskData: Database["public"]["Tables"]["tasks"]["Update"] & { id: string },
  ) => {
    updateTask(taskData);
    if (selectedTask && taskData.status) {
      setSelectedTask({ ...selectedTask, ...taskData });
    }
  };

  // Connect adding tasks to the database
  const handleAddTask = (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: any;
    project_id: string;
    assigned_to: string | null;
    created_by: string;
  }) => {
    createTask(taskData);
  };

  const handleQuickAdd = (status?: TaskStatus) => {
    if (status) {
      setQuickAddStatus(status);
    }
    setShowQuickAdd(true);
  };

  // Calculate project task counts from the live tasks
  const projectsWithCounts: Project[] = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.project_id === project.id);
      return {
        ...project,
        taskCounts: {
          todo: projectTasks.filter((t) => t.status === "todo").length,
          "in-progress": projectTasks.filter(
            (t) => t.status === "in-progress",
          ).length,
          review: projectTasks.filter((t) => t.status === "review").length,
          done: projectTasks.filter((t) => t.status === "done").length,
        },
      };
    });
  }, [projects, tasks]);

  // Filter tasks based on selected project and member
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (view === "board" && selectedProject) {
        if (task.project_id !== selectedProject) return false;
      }
      if (selectedMember) {
        if (task.assignee?.id !== selectedMember) return false;
      }
      return true;
    });
  }, [tasks, view, selectedProject, selectedMember]);

  const currentProject = projectsWithCounts.find(
    (p) => p.id === selectedProject,
  );

  const isLoading = isLoadingMembers || isLoadingProjects || isLoadingTasks;

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Loading TeamTasks...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar 
        onQuickAdd={() => handleQuickAdd()} 
        onCreateProject={() => setShowCreateProject(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <TeamSidebar
          members={teamMembers}
          selectedMember={selectedMember}
          onMemberSelect={setSelectedMember}
        />

        <main className="flex-1 overflow-auto p-6">
          {view === "dashboard" ? (
            <Dashboard
              projects={projectsWithCounts}
              onProjectClick={handleProjectClick}
            />
          ) : (
            currentProject && (
              <TaskBoard
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onAddTask={(status) => handleQuickAdd(status)}
                onBack={handleBackToDashboard}
                projectName={currentProject.name}
              />
            )
          )}
        </main>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={showTaskDetail}
        onOpenChange={setShowTaskDetail}
        onUpdateTask={handleUpdateTask}
        teamMembers={teamMembers} 
      />

      <QuickAddTask
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        defaultStatus={quickAddStatus}
        onAddTask={handleAddTask}
        projects={projects} 
        teamMembers={teamMembers} 
      />

      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
      />
    </div>
  );
};

export default Index;