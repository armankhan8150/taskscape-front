import { Task, TaskStatus, TaskPriority } from "@/types/task";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MessageSquare,
  Tag,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamMember } from "@/types/task";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useCommentMutations } from "@/hooks/useCommentMutations";
import { useState } from "react";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (task: Task) => void;
  teamMembers: TeamMember[];
}

export function TaskDetailDrawer({
  task,
  open,
  onOpenChange,
  onUpdateTask,
  teamMembers,
}: TaskDetailDrawerProps) {
  const [newComment, setNewComment] = useState("");
  const { data: comments = [] } = useTaskComments(task?.id);
  const { createComment } = useCommentMutations();

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  const handleAddComment = () => {
    if (!newComment.trim() || !task) return;
    
    createComment.mutate(
      { taskId: task.id, content: newComment },
      {
        onSuccess: () => {
          setNewComment("");
        },
      }
    );
  };

  const handleStatusChange = (status: TaskStatus) => {
    onUpdateTask({ ...task, status });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdateTask({ ...task, priority });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const assignee = teamMembers.find((m) => m.id === assigneeId);
    if (assignee) {
      onUpdateTask({ ...task, assignee });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl bg-card">
        <SheetHeader>
          <SheetTitle className="text-left text-xl">{task.title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4 mt-6">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={task.description}
                className="min-h-[100px] resize-none"
                placeholder="Add a description..."
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Status
                </label>
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Priority
                </label>
                <Select value={task.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Assignee
                </label>
                <Select
                  value={task.assignee?.id || ""}
                  onValueChange={handleAssigneeChange}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Due Date
                </label>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-muted/50",
                    isOverdue && "text-destructive border-destructive"
                  )}
                >
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Set date"}
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                <Button variant="outline" size="sm" className="h-6">
                  + Add tag
                </Button>
              </div>
            </div>

            <Separator />

            {/* Comments Section */}
            <div>
              <label className="text-sm font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comments ({comments.length})
              </label>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none bg-muted/50"
                    />
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || createComment.isPending}
                    >
                      {createComment.isPending ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
