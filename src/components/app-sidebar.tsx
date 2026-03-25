import React from "react";
import { Home, Shield, User, Lock, Cloud, Terminal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const menuItems = [
    { title: "Home", icon: Home, path: "/" },
    { title: "Challenges", icon: Shield, path: "/challenges" },
    { title: "My Profile", icon: User, path: "/profile" },
    { title: "Admin Panel", icon: Lock, path: "/admin" },
  ];
  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F38020] to-[#4F46E5] text-white shadow-lg">
            <Cloud className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Catch the Cloud</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">CTF Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1 px-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === item.path}
                  className={cn(
                    "transition-all duration-200 hover:bg-accent group",
                    location.pathname === item.path && "bg-accent/50 text-primary font-semibold"
                  )}
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors",
                      location.pathname === item.path ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
          <Terminal className="h-3 w-3" />
          <span>v1.0.0-stable</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}