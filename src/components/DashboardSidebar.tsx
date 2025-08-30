import { BarChart3, Calendar, Users, Settings, FileText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { icon: BarChart3, label: "Dashboard", active: false },
  { icon: Calendar, label: "Events", active: true },
  { icon: Users, label: "Teams", active: false },
  { icon: FileText, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
  { icon: HelpCircle, label: "Help", active: false },
];

export function DashboardSidebar() {
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
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
              item.active 
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