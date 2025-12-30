import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  LayoutGrid,
  Calendar,
  Clock,
  Users as UsersIcon,
  User,
  Folder,
  LayoutList,
  Languages,
} from "lucide-react";
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

type AccessPointRow = {
  id: number;
  page: string;
  point: string;
  user_id: number;
  created_at: string;
};

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
  { icon: Languages, label: "Language", path: "/language" },
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
    { label: "User Filter", action: "filter" },
  ],
  "/lead": [
    { label: "Download Reports", action: "download_reports" },
    { label: "View Leads", action: "view_leads" },
    { label: "Delete Lead", action: "delete_lead" },
    { label: "User Filter", action: "filter" },
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
    { label: "User Filter", action: "filter" },
  ],
  "/template": [
    { label: "Create Template", action: "create_template" },
    { label: "Edit Template", action: "edit_template" },
    { label: "Delete Template", action: "delete_template" },
  ],
  "/language":[
    { label: "Create Language", action: "create_language" },
    { label: "Edit Language", action: "edit_language" },
    { label: "Edit Transation", action: "edit_transation" },
    { label: "Delete Language", action: "delete_language" },
  ]
};

const UsersPage = () => {
  const { request, loading, error } = useApi<any>();
  const [user, setUser] = useState<UserData[] | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Access Point Modal States (for selected row)
  const [accessPointOpen, setAccessPointOpen] = useState(false);
  const [selectedUserForAccess, setSelectedUserForAccess] =
    useState<UserData | null>(null);
  const [selectedPages, setSelectedPages] = useState<PageOption[]>([]);
  const [selectedPageActions, setSelectedPageActions] = useState<
    Record<string, string[]>
  >({});
  const [userAccessPointRow, setUserAccessPointRow] =
    useState<AccessPointRow | null>(null);

  // Current logged‑in user's own access (for hiding options)
  const [myAccess, setMyAccess] = useState<AccessPointData | null>(null);
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canChangeAccess, setCanChangeAccess] = useState(false);
  const [canGenerateCode, setCanGenerateCode] = useState(false);

  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };

  const fetchUser = async () => {
    const currentUserId = getCurrentUserId();
    const email = localStorage.getItem("email");
    if (!email) return;
    const res = await request("/get_users", "GET");
    if (res && res.status_code === 200 && res.data) {
      let list: UserData[] = res.data;
      if (currentUserId !== 1015) {
        list = list.filter((u) => (u.parent_id === currentUserId || u.employee_id == currentUserId ));
      }
      setUser(list);
    } else {
      toast({
        title: "Failed to fetch users",
        description: "An error occurred while fetching user data.",
        variant: "destructive",
      });
    }
  };

  // LOAD CURRENT USER ACCESS (for hiding buttons)
  const loadMyAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const res = await request(`/get_single_access/${userId}`, "GET");
      if (res?.status_code === 200 && res.data) {
        const parsed: AccessPointData = {
          page: JSON.parse(res.data.page),
          point: JSON.parse(res.data.point),
          user_id: Number(res.data.user_id),
        };
        setMyAccess(parsed);

        const hasPage = (p: string) => parsed.page.includes(p);
        const hasAction = (page: string, action: string) => {
          const pageName = page.replace("/", "").replace(/\/+$/, "") || "dashboard";
          const suffix = `${action}_${pageName}`;
          return parsed.point.includes(suffix);
        };

        setCanCreateUser(
          hasPage("/users") && hasAction("/users", "create_user")
        );
        setCanChangeAccess(
          hasPage("/users") && hasAction("/users", "change_access")
        );
        setCanGenerateCode(
          hasPage("/users") && hasAction("/users", "generate_code")
        );
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
      setCanCreateUser(false);
      setCanChangeAccess(false);
      setCanGenerateCode(false);
    }
  };

  // FETCH ACCESS FOR SELECTED USER (Access Point modal prefill)
  const fetchUserAccessPoint = async (userId: number) => {
    try {
      const res = await request(`/get_single_access/${userId}`, "GET");
      if (res && res.status_code === 200 && res.data) {
        const rawData = res.data;
        const row: AccessPointRow = {
          id: rawData.id,
          page: rawData.page,
          point: rawData.point,
          user_id: parseInt(rawData.user_id),
          created_at: rawData.created_at,
        };
        setUserAccessPointRow(row);

        const parsed: AccessPointData = {
          page: JSON.parse(rawData.page),
          point: JSON.parse(rawData.point),
          user_id: row.user_id,
        };

        return parsed;
      }
    } catch (error) {
      console.error("Error fetching user access point:", error);
      setUserAccessPointRow(null);
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

    const accessPoint = await fetchUserAccessPoint(user.employee_id);

    if (accessPoint && accessPoint.page && accessPoint.page.length > 0) {
      const dbPages = accessPoint.page
        .map((pagePath: string) =>
          PAGE_OPTIONS.find((page) => page.path === pagePath)
        )
        .filter(Boolean) as PageOption[];
      setSelectedPages(dbPages);

      const dbPoints = accessPoint.point;
      const pageActionsMap: Record<string, string[]> = {};

      dbPages.forEach((page) => {
        const pageName =
          page.path.replace("/", "").replace(/\/+$/, "") || "dashboard";
        const pageActions = dbPoints
          .filter((point) => point.endsWith(`_${pageName}`))
          .map((point) => {
            const action = point.replace(`_${pageName}`, "");
            return (
              ACTION_OPTIONS[page.path]?.find((a) => a.action === action)
                ?.action || null
            );
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
      setSelectedPages((prev) => {
        if (prev.some((p) => p.path === page.path)) return prev;
        return [...prev, page];
      });
      setSelectedPageActions((prev) => ({
        ...prev,
        [page.path]: prev[page.path] || [],
      }));
    } else {
      setSelectedPages((prev) => prev.filter((p) => p.path !== page.path));
      setSelectedPageActions((prev) => {
        const newActions = { ...prev };
        delete newActions[page.path];
        return newActions;
      });
    }
  };

  const handleActionSelect = (
    pagePath: string,
    action: string,
    checked: boolean
  ) => {
    setSelectedPageActions((prev) => {
      const currentActions = prev[pagePath] || [];
      if (checked) {
        if (!currentActions.includes(action)) {
          return {
            ...prev,
            [pagePath]: [...currentActions, action],
          };
        }
      } else {
        const filtered = currentActions.filter((a) => a !== action);
        const newState = { ...prev };
        if (filtered.length === 0) {
          delete newState[pagePath];
        } else {
          newState[pagePath] = filtered;
        }
        return newState;
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

    if (userAccessPointRow) {
      try {
        await request(`/delete_access/${userAccessPointRow.id}`, "DELETE");
      } catch (error) {
        console.log("Delete failed, continuing...");
      }
    }

    const pagesArray: string[] = selectedPages.map((page) => page.path);
    const pointsArray: string[] = [];

    selectedPages.forEach((page) => {
      const pageActions = selectedPageActions[page.path] || [];
      const pageName =
        page.path.replace("/", "").replace(/\/+$/, "") || "dashboard";
      const pageSpecificActions = pageActions.map(
        (action) => `${action}_${pageName}`
      );
      pointsArray.push(...pageSpecificActions);
    });

    try {
      const res = await request("/create_access", "POST", {
        user_id: selectedUserForAccess.employee_id,
        page: pagesArray,
        point: pointsArray,
      });

      if (res?.status_code === 201) {
        toast({
          title: "Success",
          description: "Access points saved successfully!",
        });
        setAccessPointOpen(false);
        setSelectedPages([]);
        setSelectedPageActions({});
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
    loadMyAccess();
  }, []);

  // Updated filteredUsers with status filter
  const filteredUsers = user
    ? user.filter((u) => {
        const nameMatch = u.user_name.toLowerCase().includes(searchQuery.toLowerCase());
        const statusMatch = statusFilter === "all" || u.status.toString() === statusFilter;
        return nameMatch && statusMatch;
      })
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
                  <div className="flex gap-4">
                    <Input
                      className="w-64"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canCreateUser && (
                    <Button onClick={openAddUser}>+ Add App User</Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {loading && <p className="text-center py-8 text-muted-foreground">Loading users...</p>}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-2">
                      {typeof error === "string" ? error : "Something went wrong"}
                    </p>
                    <Button onClick={fetchUser} variant="outline">Retry</Button>
                  </div>
                )}

                {!loading && !error && user && filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      No users found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {searchQuery || statusFilter !== "all" 
                        ? "Try adjusting your search or filter criteria." 
                        : "No users available for this account."
                      }
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                      {canCreateUser && (
                        <Button onClick={openAddUser}>Add First User</Button>
                      )}
                    </div>
                  </div>
                )}

                {!loading && !error && user && filteredUsers.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="py-3 px-4 text-left">ID</th>
                          <th className="py-3 px-4 text-left">Name</th>
                          <th className="py-3 px-4 text-left">Email</th>
                          <th className="py-3 px-4 text-left">Designation</th>
                          <th className="py-3 px-4 text-left">
                            Manager User Id
                          </th>
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

                                {canChangeAccess && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAccessPoint(data)}
                                  >
                                    Access Point
                                  </Button>
                                )}

                                {canGenerateCode && (
                                  <Button
                                    className="bg-primary hover:bg-primary/90"
                                    size="sm"
                                    onClick={() =>
                                      sendCode(data.email_address)
                                    }
                                  >
                                    Generate Code
                                  </Button>
                                )}
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
                  <DialogTitle className="text-xl">
                    Configure Access Points
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Select pages and specific actions for{" "}
                    {selectedUserForAccess?.user_name}
                  </p>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Select Pages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {PAGE_OPTIONS.map((page) => {
                        const isChecked = selectedPages.some(
                          (p) => p.path === page.path
                        );

                        return (
                          <div
                            key={page.path}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              id={`page-${page.path}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handlePageSelect(page, !!checked)
                              }
                            />
                            <Label
                              htmlFor={`page-${page.path}`}
                              className="flex items-center space-x-2 cursor-pointer flex-1 font-medium"
                            >
                              <page.icon className="w-4 h-4 flex-shrink-0" />
                              <span>{page.label}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedPages.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 text-lg">
                        Select Actions for Pages
                      </h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedPages.map((page) => (
                          <div
                            key={page.path}
                            className="border p-4 rounded-lg bg-card"
                          >
                            <h4 className="font-medium mb-3 flex items-center space-x-2 text-foreground">
                              <page.icon className="w-4 h-4 flex-shrink-0" />
                              <span>{page.label}</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {ACTION_OPTIONS[page.path]?.map((action) => {
                                const isChecked = (
                                  selectedPageActions[page.path] || []
                                ).includes(action.action);

                                return (
                                  <div
                                    key={action.action}
                                    className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                                  >
                                    <Checkbox
                                      id={`action-${page.path}-${action.action}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        handleActionSelect(
                                          page.path,
                                          action.action,
                                          !!checked
                                        )
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
                        ))}
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
                      setUserAccessPointRow(null);
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
