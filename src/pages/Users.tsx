import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AddUser from "@/components/AddUser";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LayoutGrid, Calendar, Clock, UsersIcon, User, Folder, LayoutList } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type UserData = {
  employee_id: number;
  email_address: string;
  user_name: string;
  profile: string;
  parent_id: number;
  teams: number;
  status: number;
};

type AccessPointData = {
  id: number;
  page: string[]; 
  point: string[];
  user_id: number;
  created_at: string;
};

type PageOption = {
  icon: any;
  label: string;
  path: string;
};

type ActionOption = {
  label: string;
  action: string;
};

const PAGE_OPTIONS: PageOption[] = [
  { icon: LayoutGrid, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Clock, label: "Leads", path: "/lead" },
  { icon: UsersIcon, label: "Team", path: "/team" },
  { icon: User, label: "Users", path: "/users" },
  { icon: Folder, label: "Report", path: "/report" },
  { icon: LayoutList, label: "Template", path: "/template" },
];

const ACTION_OPTIONS: Record<string, ActionOption[]> = {
  "/": [
    { label: "View Dashboard", action: "view_dashboard" },
    { label: "Download Reports", action: "download_reports" },
  ],
  "/events": [
    { label: "Create Event", action: "create_event" },
    { label: "View Events", action: "view_events" },
    { label: "Edit Event", action: "edit_event" },
  ],
  "/lead": [
    { label: "Download Reports", action: "download_reports" },
    { label: "View Leads", action: "view_leads" },
    { label: "Delete Lead", action: "delete_lead" },
  ],
  "/team": [
    { label: "View Team", action: "view_team" },
    { label: "Add Team", action: "add_team" },
    { label: "Edit Team", action: "edit_team" },
  ],
  "/users": [
    { label: "Create User", action: "create_user" },
    { label: "Update User", action: "update_user" },
    { label: "Change Access", action: "change_access" },
    { label: "Generate Code", action: "generate_code" },
  ],
  "/report": [
    { label: "Download Report", action: "download_report" },
  ],
  "/template": [
    { label: "Create Template", action: "create_template" },
    { label: "Edit Template", action: "edit_template" },
    { label: "Delete Template", action: "delete_template" },
  ],
};

const UsersPage = () => {
  const { request, loading, error } = useApi<any>();
  const [user, setUser] = useState<UserData[] | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Access Point Modal States
  const [accessPointOpen, setAccessPointOpen] = useState(false);
  const [selectedUserForAccess, setSelectedUserForAccess] = useState<UserData | null>(null);
  const [selectedPages, setSelectedPages] = useState<PageOption[]>([]);
  const [selectedPageActions, setSelectedPageActions] = useState<Record<string, string[]>>({});
  const [userAccessPoint, setUserAccessPoint] = useState<AccessPointData | null>(null);

  const fetchUser = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const res = await request("/get_users", "GET");
    if (res && res.status_code === 200 && res.data) {
      setUser(res.data);
    } else {
      toast({
        title: "Failed to fetch users",
        description: "An error occurred while fetching user data.",
        variant: "destructive",
      });
    }
  };

  const fetchUserAccessPoint = async (userId: number) => {
    try {
      // ✅ Use get_single_access/:user_id API
      const res = await request(`/get_single_access/${userId}`, "GET");
      if (res && res.status_code === 200 && res.data) {
        const rawData = res.data;
        const parsedData: AccessPointData = {
          id: rawData.id,
          page: JSON.parse(rawData.page), // Parse JSON string to array
          point: JSON.parse(rawData.point), // Parse JSON string to array
          user_id: parseInt(rawData.user_id),
          created_at: rawData.created_at
        };
        setUserAccessPoint(parsedData);
        return parsedData;
      }
    } catch (error) {
      console.error("Error fetching user access point:", error);
      setUserAccessPoint(null);
    }
    return null;
  };

  const sendCode = async (email: any) => {
    if (!email) {
      toast({
        title: "Missing email",
        description: "Please provide a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const res = await request("/generate_otp", "POST", { email_id: email });

    if (res?.message === "OTP sent successfully") {
      toast({
        title: "Success",
        description: "OTP has been sent to the user's email!",
      });
    } else {
      toast({
        title: "Failed",
        description: res?.msg || "Something went wrong while sending OTP.",
        variant: "destructive",
      });
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setAddUserOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
  };

  const handleAccessPoint = async (user: UserData) => {
    setSelectedUserForAccess(user);
    setSelectedPages([]);
    setSelectedPageActions({});
    
    // ✅ Fetch single user access point using get_single_access/:user_id
    const accessPoint = await fetchUserAccessPoint(user.employee_id);
    
    // ✅ Prefill form with DB data
    if (accessPoint && accessPoint.page && accessPoint.page.length > 0) {
      // Prefill selected pages
      const dbPages = accessPoint.page
        .map((pagePath: string) => PAGE_OPTIONS.find(page => page.path === pagePath))
        .filter(Boolean) as PageOption[];
      setSelectedPages(dbPages);
      
      // Prefill selected actions
      const dbPoints = accessPoint.point;
      const pageActionsMap: Record<string, string[]> = {};
      
      dbPages.forEach((page) => {
        const pageName = page.path.replace('/', '').replace(/\/+$/, '') || 'dashboard';
        const pageActions = dbPoints
          .filter(point => point.endsWith(`_${pageName}`))
          .map(point => {
            const action = point.replace(`_${pageName}`, '');
            // Verify action exists for this page
            return ACTION_OPTIONS[page.path]?.find(a => a.action === action)?.action || null;
          })
          .filter(Boolean) as string[];
        
        if (pageActions.length > 0) {
          pageActionsMap[page.path] = pageActions;
        }
      });
      
      setSelectedPageActions(pageActionsMap);
    }
    
    setAccessPointOpen(true);
  };

  const handlePageSelect = (page: PageOption, checked: boolean) => {
    if (checked) {
      setSelectedPages(prev => {
        if (prev.some(p => p.path === page.path)) return prev;
        return [...prev, page];
      });
      setSelectedPageActions(prev => ({
        ...prev,
        [page.path]: []
      }));
    } else {
      setSelectedPages(prev => prev.filter(p => p.path !== page.path));
      setSelectedPageActions(prev => {
        const newActions = { ...prev };
        delete newActions[page.path];
        return newActions;
      });
    }
  };

  const handleActionSelect = (pagePath: string, action: string, checked: boolean) => {
    setSelectedPageActions(prev => {
      const currentActions = prev[pagePath] || [];
      if (checked) {
        if (!currentActions.includes(action)) {
          return {
            ...prev,
            [pagePath]: [...currentActions, action]
          };
        }
      } else {
        const filtered = currentActions.filter(a => a !== action);
        if (filtered.length === 0) {
          const newActions = { ...prev };
          delete newActions[pagePath];
          return newActions;
        }
        return {
          ...prev,
          [pagePath]: filtered
        };
      }
      return prev;
    });
  };

  const saveAccessPoints = async () => {
    if (!selectedUserForAccess || selectedPages.length === 0) {
      toast({
        title: "No selection",
        description: "Please select at least one page.",
        variant: "destructive",
      });
      return;
    }

    // Delete existing access point if it exists
    if (userAccessPoint) {
      try {
        await request(`/delete_access/${userAccessPoint.id}`, "DELETE");
      } catch (error) {
        console.log("Delete failed, continuing...");
      }
    }

    // Create new access point with single API call
    const pagesArray: string[] = selectedPages.map(page => page.path);
    const pointsArray: string[] = [];

    selectedPages.forEach((page) => {
      const pageActions = selectedPageActions[page.path] || [];
      const pageName = page.path.replace('/', '').replace(/\/+$/, '') || 'dashboard';
      const pageSpecificActions = pageActions.map(action => 
        `${action}_${pageName}`
      );
      pointsArray.push(...pageSpecificActions);
    });

    try {
      const res = await request("/create_access", "POST", {
        user_id: selectedUserForAccess.employee_id,
        page: pagesArray,
        point: pointsArray
      });

      if (res?.status_code === 201) {
        toast({
          title: "Success",
          description: "Access points saved successfully!",
        });
        setAccessPointOpen(false);
        setSelectedPages([]);
        setSelectedPageActions({});
        // Refresh user access point data
        fetchUserAccessPoint(selectedUserForAccess.employee_id);
      } else {
        toast({
          title: "Failed",
          description: res?.error || "Failed to save access points.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving access points.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const filteredUsers = user
    ? user.filter((u) =>
        u.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Parent & Team Users
            </h1>
            <p className="text-muted-foreground">
              Manage Users for Parent & Team Accounts
            </p>
          </div>

          <div className="w-full">
            <Card>
              <CardHeader className="flex justify-between flex-row space-y-0 items-center">
                <div className="flex flex-row space-y-0 items-center gap-8">
                  <CardTitle>App User Management</CardTitle>
                  <Input
                    className="w-64"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={openAddUser}>+ Add App User</Button>
                </div>
              </CardHeader>

              <CardContent>
                {loading && <p>Loading users...</p>}
                {error && (
                  <p className="text-red-500">
                    {typeof error === "string" ? error : "Something went wrong"}
                  </p>
                )}

                {!loading && !error && user && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="py-3 px-4 text-left">ID</th>
                          <th className="py-3 px-4 text-left">Name</th>
                          <th className="py-3 px-4 text-left">Email</th>
                          <th className="py-3 px-4 text-left">Designation</th>
                          <th className="py-3 px-4 text-left">Manager User Id</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((data) => (
                          <tr
                            key={data.employee_id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              {data.employee_id}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {data.user_name}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {data.email_address}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <Badge variant="outline">{data.profile}</Badge>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {data.parent_id}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {data.status === 1 ? "Active" : "Inactive"}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="flex gap-2 justify-center flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(data)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAccessPoint(data)}
                                >
                                  Access Point
                                </Button>
                                <Button
                                  className="bg-primary hover:bg-primary/90"
                                  size="sm"
                                  onClick={() => sendCode(data.email_address)}
                                >
                                  Generate Code
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Access Point Modal */}
            <Dialog open={accessPointOpen} onOpenChange={setAccessPointOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl">Configure Access Points</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Select pages and specific actions for {selectedUserForAccess?.user_name}
                  </p>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Select Pages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {PAGE_OPTIONS.map((page) => {
                        const hasAccess = userAccessPoint?.page?.includes(page.path);
                        const isChecked = selectedPages.some(p => p.path === page.path);
                        
                        return (
                          <div key={page.path} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <Checkbox
                              id={`page-${page.path}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handlePageSelect(page, !!checked)}
                            />
                            <Label htmlFor={`page-${page.path}`} className="flex items-center space-x-2 cursor-pointer flex-1 font-medium">
                              <page.icon className="w-4 h-4 flex-shrink-0" />
                              <span>{page.label}</span>
                              {hasAccess && !isChecked && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Current
                                </Badge>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedPages.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 text-lg">Select Actions for Pages</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedPages.map((page) => {
                          const existingPoints = userAccessPoint?.point || [];
                          
                          return (
                            <div key={page.path} className="border p-4 rounded-lg bg-card">
                              <h4 className="font-medium mb-3 flex items-center space-x-2 text-foreground">
                                <page.icon className="w-4 h-4 flex-shrink-0" />
                                <span>{page.label}</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {ACTION_OPTIONS[page.path]?.map((action) => {
                                  const pageName = page.path.replace('/', '').replace(/\/+$/, '') || 'dashboard';
                                  const suffixedAction = `${action.action}_${pageName}`;
                                  const isChecked = (selectedPageActions[page.path] || []).includes(action.action) || 
                                                   existingPoints.includes(suffixedAction);
                                  
                                  return (
                                    <div key={action.action} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors">
                                      <Checkbox
                                        id={`action-${page.path}-${action.action}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => 
                                          handleActionSelect(page.path, action.action, !!checked)
                                        }
                                      />
                                      <Label 
                                        htmlFor={`action-${page.path}-${action.action}`}
                                        className="cursor-pointer text-sm font-normal"
                                      >
                                        {action.label}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAccessPointOpen(false);
                      setSelectedPages([]);
                      setSelectedPageActions({});
                      setUserAccessPoint(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveAccessPoints} 
                    disabled={selectedPages.length === 0}
                  >
                    Save Access Points
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <AddUser
              open={addUserOpen || !!editingUser}
              onClose={() => {
                setAddUserOpen(false);
                setEditingUser(null);
              }}
              onUserAdded={fetchUser}
              editingUser={editingUser}
              clearEditingUser={() => setEditingUser(null)}
            />
          </div>

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">© Eprevent 2025</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UsersPage;
