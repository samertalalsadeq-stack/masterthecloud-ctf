import React from "react";
import { Home, Shield, User, Lock, Cloud, Terminal, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { useUserStore } from "@/stores/userStore";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const logout = useUserStore(s => s.logout);
  const handleLogout = () => {
    logout();
    queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
    toast.success("Logged out successfully");
    navigate("/");
  };
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#F38020] text-white shadow-lg">
            <Cloud className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">Master the Cloud</span>
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
                    location.pathname === item.path && "bg-brand-indigo/10 text-brand-indigo font-semibold"
                  )}
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors",
                      location.pathname === item.path ? "text-brand-indigo" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {isLoggedIn && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group text-muted-foreground"
                >
                  <div className="flex items-center gap-3 w-full">
                    <LogOut className="h-4 w-4 group-hover:text-destructive transition-colors" />
                    <span>Logout</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
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