import { LayoutGrid, Calendar, Clock, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  { icon: LayoutGrid, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Events", path: "/events" },
  // { icon: Clock, label: "Analytics", path: "/analytics" },
  { icon: Users, label: "Teams", path: "/teams" },
  { icon: User, label: "Users", path: "/users" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-16 bg-card border-r border-border min-h-screen">
      <div className="flex items-center justify-center h-16 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">iC</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigationItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
              location.pathname === item.path 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </nav>
    </div>
  );
}