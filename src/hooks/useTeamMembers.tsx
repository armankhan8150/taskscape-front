import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types/task";

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          user_roles (role)
        `);

      if (profilesError) throw profilesError;

      // Transform the data to match TeamMember interface
      const teamMembers: TeamMember[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || profile.email || "Unknown",
        email: profile.email,
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`,
        role: profile.user_roles?.[0]?.role || "employee",
      }));

      return teamMembers;
    },
  });
};
