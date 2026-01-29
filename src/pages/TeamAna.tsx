import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Check, Filter } from "lucide-react"; 
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

type Member = {
  employee_id: string;
  user_name: string;
  email_address: string;
};

type Team = {
  team_id: string;
  manager_id: string | number;
  manager_name: string;
  team_name: string;
  members: Member[];
};

// 🔹 ACCESS CONTROL TYPES
interface AccessPointData {
  page: string[];
  point: string[];
  user_id: number;
}

export default function TeamAnalytics() {
  const { request, loading } = useApi();
  const { toast } = useToast();

  // 🔹 ACCESS CONTROL STATES
  const [myAccess, setMyAccess] = useState<AccessPointData | null>(null);
  const [canViewTeam, setCanViewTeam] = useState(false);
  const [canAddTeam, setCanAddTeam] = useState(false);
  const [canEditTeam, setCanEditTeam] = useState(false);

  // 🔹 EXISTING STATES
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<Member[]>([]);
  
  // 🔹 FILTER STATE
  const [filterUserId, setFilterUserId] = useState<string>("all");

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editTeamObj, setEditTeamObj] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    team_name: "",
    manager_id: "",
    employees_id: [] as string[],
  });

  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };

  const currentUserId = getCurrentUserId();

  // 🔹 CALCULATE DROPDOWN USERS BASED ON PERMISSIONS
  const dropdownUsers = useMemo(() => {
    // 1. If user is 1015, show everyone
    if (currentUserId === 1015) {
      return users;
    }

    // 2. Otherwise, find users "under" this person
    // "Under" = Members of teams where current user is the Manager
    const allowedIds = new Set<string>();

    // Always include self
    allowedIds.add(String(currentUserId));

    teams.forEach((team) => {
      // If current user manages this team
      if (String(team.manager_id) === String(currentUserId)) {
        // Add all members of this team to allowed list
        team.members.forEach((member) => {
          allowedIds.add(String(member.employee_id));
        });
      }
    });

    // Filter the main users list
    return users.filter((u) => allowedIds.has(String(u.employee_id)));
  }, [users, teams, currentUserId]);


  // 🔹 LOAD USER ACCESS FOR TEAM PAGE
  const loadMyAccess = async () => {
    if (!currentUserId) return;

    try {
      const res: any = await request(`/get_single_access/${currentUserId}`, "GET");
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

        setCanViewTeam(hasPage("/team") && hasAction("/team", "view_team"));
        setCanAddTeam(hasPage("/team") && hasAction("/team", "add_team"));
        setCanEditTeam(hasPage("/team") && hasAction("/team", "edit_team"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
    }
  };

  useEffect(() => {
    loadMyAccess();
  }, []);

  // Data loading functions
  const fetchUsers = async () => {
    try {
      const res = await request("/get_users", "GET");
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error("fetchUsers error", e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await request("/get_all_teams", "GET");
      if (Array.isArray(res)) {
        setTeams(res);
      } else if (res?.success && Array.isArray(res.data)) {
        setTeams(res.data);
      } else {
        setTeams([]);
      }
    } catch (e) {
      console.error("fetchTeams error", e);
      setTeams([]);
    }
  };

  // Load data ONLY after permissions are granted
  useEffect(() => {
    if (canViewTeam) {
      fetchUsers();
      fetchTeams();
    }
  }, [canViewTeam]);

  // 🔹 FILTER LOGIC FOR TABLE
  const filteredTeams = teams.filter((team) => {
    if (filterUserId === "all") return true;
    
    // Check if user is Manager
    if (String(team.manager_id) === filterUserId) return true;

    // Check if user is a Member
    if (team.members.some((m) => String(m.employee_id) === filterUserId)) return true;

    return false;
  });

  const openTeamDialog = (team?: Team) => {
    if (!canAddTeam && !canEditTeam) {
      toast({
        title: "❌ No Permission",
        description: "You don't have permission to create or edit teams.",
        variant: "destructive",
      });
      return;
    }
    setTeamDialogOpen(true);
    setEditTeamObj(team || null);

    if (team) {
      setFormData({
        team_name: team.team_name,
        manager_id: team.manager_id ? String(team.manager_id) : "", 
        employees_id: team.members.map((m) => String(m.employee_id)),
      });
    } else {
      setFormData({ team_name: "", manager_id: "", employees_id: [] });
    }
  };

  const toggleEmployee = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      employees_id: prev.employees_id.includes(id)
        ? prev.employees_id.filter((eid) => eid !== id)
        : [...prev.employees_id, id],
    }));
  };

  const handleChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleCreateOrUpdateTeam = async () => {
    if (!formData.team_name.trim() || !formData.manager_id || formData.employees_id.length === 0) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    try {
      let res;
      if (editTeamObj) {
        if (!canEditTeam) {
          toast({ title: "❌ No edit permission", variant: "destructive" });
          return;
        }
        res = await request("/update_team", "POST", {
          team_id: editTeamObj.team_id,
          team_name: formData.team_name,
          manager_id: formData.manager_id,
          employee_ids: formData.employees_id,
        });
      } else {
        if (!canAddTeam) {
          toast({ title: "❌ No create permission", variant: "destructive" });
          return;
        }
        res = await request("/create_team", "POST", {
          team_name: formData.team_name,
          manager_id: formData.manager_id,
          employee_ids: formData.employees_id,
        });
      }

      if (res?.success || res?.message?.includes("success")) {
        toast({ title: editTeamObj ? "Team updated" : "Team created" });
        setTeamDialogOpen(false);
        setEditTeamObj(null);
        fetchTeams();
      } else {
        toast({
          title: "Operation failed",
          description: res?.error || res?.msg || "Server error",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({ title: "Network error", variant: "destructive" });
    }
  };

  // 🔹 ACCESS DENIED VIEW
  if (!canViewTeam && myAccess !== null) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
                <p>You don't have permission to view Teams.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-foreground">All Teams</h2>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* 🔹 USER FILTER DROPDOWN */}
                <div className="w-[250px]">
                    <Select value={filterUserId} onValueChange={setFilterUserId}>
                        <SelectTrigger className="bg-background border-input">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="Filter by User" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {/* Map over the filtered dropdownUsers instead of all users */}
                            {dropdownUsers.map((user) => (
                                <SelectItem key={user.employee_id} value={String(user.employee_id)}>
                                    {user.user_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {canAddTeam && (
                <Button onClick={() => openTeamDialog()}>
                    <Plus className="w-4 h-4 mr-2" /> Create New Team 
                </Button>
                )}
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {filteredTeams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {canViewTeam ? "No teams found matching criteria." : "Loading teams..."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        {/* <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team ID</th> */}
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Manager</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Members</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeams.map((team) => (
                        <tr key={team.team_id} className="border-b hover:bg-muted/20">
                          {/* <td className="py-3 px-4 font-mono text-sm">{team.team_id}</td> */}
                          <td className="py-3 px-4">{team.manager_name}</td>
                          <td className="py-3 px-4 font-medium">{team.team_name}</td>
                          
                          {/* 🔹 UPDATED: LISTING TEAM MEMBERS WITH BADGES INSTEAD OF COUNT */}
                          <td className="py-3 px-4 max-w-[400px]">
                            <div className="flex flex-wrap gap-1">
                                {team.members && team.members.length > 0 ? (
                                    team.members.map((member) => (
                                        <Badge 
                                            key={member.employee_id} 
                                            variant="outline" 
                                            className="font-normal text-xs bg-muted/30"
                                        >
                                            {member.user_name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {canEditTeam ? (
                              <Button 
                                onClick={() => openTeamDialog(team)} 
                                variant="outline" 
                                size="sm"
                              >
                                Edit
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No access</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTeamObj ? "Edit Team" : "Create New Team"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Team Name *</Label>
              <Input
                id="team_name"
                value={formData.team_name}
                onChange={handleChange}
                placeholder="Enter team name"
                className="border-gray-400"
              />
            </div>
            <div>
              <Label>Manager *</Label>
              <Select 
                value={formData.manager_id} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, manager_id: val }))}
              >
                <SelectTrigger className="border-gray-400">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.employee_id} value={String(user.employee_id)}>
                      {user.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employees *</Label>
              <Command className="border border-gray-400 rounded-md">
                <CommandInput placeholder="Search employees..." />
                <CommandEmpty>No employees found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {users.map(user => {
                    const userId = String(user.employee_id);
                    const isSelected = formData.employees_id.includes(userId);
                    
                    return (
                        <CommandItem 
                            key={user.employee_id} 
                            onSelect={() => toggleEmployee(userId)}
                            className="cursor-pointer"
                        >
                        <div className="flex items-center justify-between w-full">
                            <span className={isSelected ? "font-semibold text-primary" : ""}>
                                {user.user_name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.employees_id.map(id => {
                  const emp = users.find(u => String(u.employee_id) === id);
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center space-x-1 border-gray-400 border">
                      <span>{emp?.user_name || id}</span>
                      <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleEmployee(id)} />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-6">
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrUpdateTeam} disabled={loading}>
              {loading ? "Saving..." : editTeamObj ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}