-- Update handle_new_user to create default team and project
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_team_id uuid;
  new_project_id uuid;
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
  
  -- Create default team for new user
  INSERT INTO public.teams (name, description, created_by)
  VALUES (
    NEW.email || '''s Team',
    'Default team for ' || NEW.email,
    NEW.id
  )
  RETURNING id INTO new_team_id;
  
  -- Add user to their team
  INSERT INTO public.team_members (team_id, user_id, added_by)
  VALUES (new_team_id, NEW.id, NEW.id);
  
  -- Create default project
  INSERT INTO public.projects (name, description, created_by, color)
  VALUES (
    'My First Project',
    'Welcome to your first project!',
    NEW.id,
    '#3b82f6'
  )
  RETURNING id INTO new_project_id;
  
  -- Link project to team
  INSERT INTO public.project_teams (project_id, team_id)
  VALUES (new_project_id, new_team_id);
  
  RETURN NEW;
END;
$$;