import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SupportModeBanner } from "./SupportModeBanner";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/contexts/SidebarContext";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { collapsed } = useSidebarContext();

  return (
    <div className="min-h-screen bg-background">
      <SupportModeBanner />
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "pl-16" : "pl-64"
        )}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
