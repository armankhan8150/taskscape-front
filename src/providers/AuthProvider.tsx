import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: ("admin" | "manager" | "employee")[];
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<("admin" | "manager" | "employee")[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer role fetching to avoid deadlocks
        setTimeout(() => {
          fetchRoles(session.user.id).catch(console.error);
        }, 0);
      } else {
        setRoles([]);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id).catch(console.error);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.error("Failed to load roles", error);
      setRoles([]);
      return;
    }
    const r = (data || []).map((r: any) => r.role) as ("admin" | "manager" | "employee")[];
    setRoles(r);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    roles,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  }), [user, session, loading, roles]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
