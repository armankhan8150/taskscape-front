import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

const statusColors = {
  todo: "bg-status-todo/10 border-status-todo/20",
  "in-progress": "bg-status-in-progress/10 border-status-in-progress/20",
  review: "bg-status-review/10 border-status-review/20",
  done: "bg-status-done/10 border-status-done/20",
};

export function TaskColumn({ status, title, tasks, onTaskClick, onAddTask }: TaskColumnProps) {
  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
          <span className={cn(
            "flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium",
            statusColors[status]
          )}>
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
}
