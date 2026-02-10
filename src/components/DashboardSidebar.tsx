import { LayoutGrid, Calendar, Clock, Users, User, Folder, LayoutList, Languages, LandPlot, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApi } from "@/hooks/useApi";
import { useEffect, useState } from "react";

type AccessPointData = {
  page: string[];
  point: string[];
  user_id: number;
};

type PageOption = {
  icon: any;
  label: string;
  path: string;
};

const ALL_NAVIGATION_ITEMS: PageOption[] = [
  { icon: LayoutGrid, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Clock, label: "Leads", path: "/lead" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: User, label: "Users", path: "/users" },
  { icon: Folder, label: "Report", path: "/report" },
  { icon: LayoutList, label: "Template", path: "/template" },
  { icon: Languages, label: "Language", path: "/language" },
  { icon: LandPlot, label: "Area Of Intrest", path: "/areaofintrest" },
  { icon: Mail, label: "Email-opt in", path: "/opt-in" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { request, loading } = useApi<any>();
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [userAccessPoint, setUserAccessPoint] = useState<AccessPointData | null>(null);

  // Get current user ID from localStorage
  const getCurrentUserId = (): number => {
    try {
      const userData = localStorage.getItem("user_id");
      return userData ? parseInt(userData) : 0;
    } catch {
      return 0;
    }
  };

  const fetchUserAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const res = await request(`/get_single_access/${userId}`, "GET");
      if (res && res.status_code === 200 && res.data) {
        const parsedData: AccessPointData = {
          page: JSON.parse(res.data.page),
          point: JSON.parse(res.data.point),
          user_id: parseInt(res.data.user_id)
        };
        setUserAccessPoint(parsedData);
        setAllowedPages(parsedData.page);
      }
    } catch (error) {
      console.error("Error fetching user access:", error);
      // Show all pages if no access data
      setAllowedPages(ALL_NAVIGATION_ITEMS.map(item => item.path));
    }
  };

  // Filter navigation items based on allowed pages
  const navigationItems = ALL_NAVIGATION_ITEMS.filter(item => 
    allowedPages.includes(item.path)
  );

  useEffect(() => {
    fetchUserAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col w-16 bg-card border-r border-border min-h-screen">
        <div className="flex items-center justify-center h-16 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center animate-pulse">
            <span className="text-primary-foreground font-semibold text-sm">Ep</span>
          </div>
        </div>
        <div className="flex-1 px-2 py-4 space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="w-12 h-12 bg-muted rounded-lg animate-pulse mx-auto" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-16 bg-card border-r border-border min-h-screen">
      {/* Logo section */}
      <div className="flex items-center justify-center h-16 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">Ep</span>
          </div>
        </div>
      </div>

      {/* Navigation with tooltips - Only allowed pages */}
      <TooltipProvider>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigationItems.map((item, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
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
              </TooltipTrigger>
              <TooltipContent side="right" className="text-sm font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>

      {/* Debug info (remove in production) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="p-2 border-t border-border text-xs text-muted-foreground">
          <div>Allowed: {allowedPages.length}</div>
          <div>User ID: {getCurrentUserId()}</div>
        </div>
      )} */}
    </div>
  );
}
