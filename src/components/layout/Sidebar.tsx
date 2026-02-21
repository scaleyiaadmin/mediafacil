import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus, FileText, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.png";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Novo Orçamento", href: "/novo-orcamento", icon: FilePlus },
  { name: "Orçamentos", href: "/orcamentos", icon: FileText },
  { name: "Fornecedores", href: "/fornecedores", icon: Users },
];

export function Sidebar() {
  const location = useLocation();
  const { collapsed, toggleCollapsed, userRole, loadingRole } = useSidebarContext();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Novo Orçamento", href: "/novo-orcamento", icon: FilePlus },
    ...(userRole === 'super_admin' ? [{ name: "Fornecedores", href: "/fornecedores", icon: Users }] : []),
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo - Aumentada */}
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border transition-all duration-300",
            collapsed ? "h-16 justify-center px-2" : "h-20 gap-3 px-4"
          )}
        >
          <img
            src={logo}
            alt="Média Fácil"
            className={cn(
              "object-contain transition-all duration-300",
              collapsed ? "h-10 w-10" : "h-14 w-14"
            )}
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">Média Fácil</span>
              <span className="text-xs text-muted-foreground">
                Formação de Preços
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher menu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
