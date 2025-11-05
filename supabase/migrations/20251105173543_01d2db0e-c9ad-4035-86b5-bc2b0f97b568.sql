-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('todo', 'in-progress', 'review', 'done');

-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create team_members junction table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_teams junction table
CREATE TABLE public.project_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, team_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user's highest role priority
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'employee' THEN 3
  END
  LIMIT 1
$$;

-- Create function to check if user is in team
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default employee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teams
CREATE POLICY "Users can view teams they're in"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), id)
  );

CREATE POLICY "Admins and managers can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admins and team creators can update teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid()
  );

CREATE POLICY "Admins can delete teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY "Admins and managers can add team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'manager') AND public.is_team_member(auth.uid(), team_id))
  );

CREATE POLICY "Admins and managers can remove team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'manager') AND public.is_team_member(auth.uid(), team_id))
  );

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their teams"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.project_teams pt
      JOIN public.team_members tm ON tm.team_id = pt.team_id
      WHERE pt.project_id = projects.id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admins and project creators can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid()
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for project_teams
CREATE POLICY "Users can view project teams of their projects"
  ON public.project_teams FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = project_teams.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can manage project teams"
  ON public.project_teams FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their projects"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_teams pt
      JOIN public.team_members tm ON tm.team_id = pt.team_id
      WHERE pt.project_id = tasks.project_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and admins can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    (assigned_to = auth.uid() AND created_by = auth.uid())
  );

CREATE POLICY "Users can update tasks they created or are assigned to"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    (public.has_role(auth.uid(), 'manager') AND EXISTS (
      SELECT 1 FROM public.project_teams pt
      JOIN public.team_members tm ON tm.team_id = pt.team_id
      WHERE pt.project_id = tasks.project_id AND tm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Admins and task creators can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    created_by = auth.uid()
  );

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments on tasks they can view"
  ON public.task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id AND (
        public.has_role(auth.uid(), 'admin') OR
        t.assigned_to = auth.uid() OR
        t.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_teams pt
          JOIN public.team_members tm ON tm.team_id = pt.team_id
          WHERE pt.project_id = t.project_id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on tasks they can view"
  ON public.task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND (
        public.has_role(auth.uid(), 'admin') OR
        t.assigned_to = auth.uid() OR
        t.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_teams pt
          JOIN public.team_members tm ON tm.team_id = pt.team_id
          WHERE pt.project_id = t.project_id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.task_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments or admins can delete any"
  ON public.task_comments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;