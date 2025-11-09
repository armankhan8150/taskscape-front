import { Task } from "@/types/task";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "done";

  return (
    <div
      className="task-card group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-sm line-clamp-2 flex-1">
          {task.title}
        </h3>
        {isOverdue && (
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 ml-2" />
        )}
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags?.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {(task.tags?.length || 0) > 2 && (
          <Badge variant="secondary" className="text-xs">
            +{(task.tags?.length || 0) - 2}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          {task.due_date && (
            <div
              className={cn(
                "flex items-center gap-1",
                isOverdue && "text-destructive",
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(task.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          {task.comment_count > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comment_count}</span>
            </div>
          )}
        </div>

        {task.assignee && (
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={task.assignee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee.id}`}
              alt={task.assignee.full_name || "User"}
            />
            <AvatarFallback className="text-xs">
              {task.assignee.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className="mt-2 pt-2 border-t">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            task.priority === "high" &&
              "border-priority-high text-priority-high",
            task.priority === "medium" &&
              "border-priority-medium text-priority-medium",
            task.priority === "low" && "border-priority-low text-priority-low",
          )}
        >
          {task.priority}
        </Badge>
      </div>
    </div>
  );
}