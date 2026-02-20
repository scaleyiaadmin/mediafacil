import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  userRole: string | null;
  loadingRole: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('usuarios')
            .select('tipo')
            .eq('email', user.email)
            .single();

          if (profile) {
            setUserRole(profile.tipo);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoadingRole(false);
      }
    }
    getProfile();
  }, []);

  return (
    <SidebarContext.Provider value={{
      collapsed,
      setCollapsed,
      toggleCollapsed,
      userRole,
      loadingRole
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}
