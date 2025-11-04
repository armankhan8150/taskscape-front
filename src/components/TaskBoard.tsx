import { Task, TaskStatus } from "@/types/task";
import { TaskColumn } from "./TaskColumn";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, SlidersHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onBack: () => void;
  projectName: string;
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in-progress", title: "In Progress" },
  { status: "review", title: "Review" },
  { status: "done", title: "Done" },
];

export function TaskBoard({ tasks, onTaskClick, onAddTask, onBack, projectName }: TaskBoardProps) {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{projectName}</h1>
            <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex gap-4 pb-4">
          {columns.map((column) => (
            <TaskColumn
              key={column.status}
              status={column.status}
              title={column.title}
              tasks={getTasksByStatus(column.status)}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
