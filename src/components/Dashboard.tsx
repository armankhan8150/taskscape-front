import { Project } from "@/types/task";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface DashboardProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

export function Dashboard({ projects, onProjectClick }: DashboardProps) {
  const totalTasks = projects.reduce(
    (sum, p) => sum + Object.values(p.taskCounts).reduce((a, b) => a + b, 0),
    0
  );
  const completedTasks = projects.reduce((sum, p) => sum + p.taskCounts.done, 0);
  const inProgressTasks = projects.reduce((sum, p) => sum + p.taskCounts["in-progress"], 0);
  const reviewTasks = projects.reduce((sum, p) => sum + p.taskCounts.review, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all projects and tasks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-status-in-progress" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <TrendingUp className="h-4 w-4 text-status-review" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewTasks}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-status-done" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">To Do</div>
                    <div className="text-lg font-semibold">{project.taskCounts.todo}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">In Progress</div>
                    <div className="text-lg font-semibold text-status-in-progress">
                      {project.taskCounts["in-progress"]}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Review</div>
                    <div className="text-lg font-semibold text-status-review">
                      {project.taskCounts.review}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Done</div>
                    <div className="text-lg font-semibold text-status-done">
                      {project.taskCounts.done}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => onProjectClick(project.id)}
                >
                  View Board
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
