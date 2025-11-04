import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { TeamSidebar } from "@/components/TeamSidebar";
import { Dashboard } from "@/components/Dashboard";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskDetailDrawer } from "@/components/TaskDetailDrawer";
import { QuickAddTask } from "@/components/QuickAddTask";
import { tasks as initialTasks, projects, teamMembers } from "@/data/mockData";
import { Task, TaskStatus } from "@/types/task";
import { toast } from "sonner";

type View = "dashboard" | "board";

const Index = () => {
  const [view, setView] = useState<View>("dashboard");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState<TaskStatus>("todo");

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

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
    toast.success("Task updated successfully");
  };

  const handleAddTask = (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: any;
    projectId: string;
    assigneeId: string;
  }) => {
    const assignee = teamMembers.find((m) => m.id === taskData.assigneeId) || null;
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      assignee,
      dueDate: null,
      tags: [],
      comments: [],
      projectId: taskData.projectId,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    toast.success("Task created successfully");
  };

  const handleQuickAdd = (status?: TaskStatus) => {
    if (status) {
      setQuickAddStatus(status);
    }
    setShowQuickAdd(true);
  };

  const filteredTasks = tasks.filter((task) => {
    if (view === "board" && selectedProject) {
      if (task.projectId !== selectedProject) return false;
    }
    if (selectedMember) {
      if (task.assignee?.id !== selectedMember) return false;
    }
    return true;
  });

  const currentProject = projects.find((p) => p.id === selectedProject);

  return (
    <div className="h-screen flex flex-col">
      <Navbar onQuickAdd={() => handleQuickAdd()} />

      <div className="flex-1 flex overflow-hidden">
        <TeamSidebar
          members={teamMembers}
          selectedMember={selectedMember}
          onMemberSelect={setSelectedMember}
        />

        <main className="flex-1 overflow-auto p-6">
          {view === "dashboard" ? (
            <Dashboard projects={projects} onProjectClick={handleProjectClick} />
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
      />

      <QuickAddTask
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        defaultStatus={quickAddStatus}
        onAddTask={handleAddTask}
      />
    </div>
  );
};

export default Index;
