import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

type Member = {
  employee_id: string;
  user_name: string;
  email_address: string;
};

type Team = {
  team_id: string;
  manager_id: string;
  manager_name: string;
  team_name: string;
  members: Member[];
};

type EventSummary = {
  total_events: number;
  active_events: string;
};

export default function TeamAnalytics() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<Member[]>([]);
  const [analyticsData, setAnalyticsData] = useState<EventSummary | null>(null);

  const { request, loading } = useApi();
  const { toast } = useToast();

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editTeamObj, setEditTeamObj] = useState<Team | null>(null);

  const [formData, setFormData] = useState({
    team_name: "",
    manager_id: "",
    employees_id: [] as string[],
  });

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    fetchEventSummary();
  }, []);

  const fetchUsers = async () => {
    const res = await request("/get_users", "GET");
    setUsers(Array.isArray(res?.data) ? res.data : []);
  };

  const fetchTeams = async () => {
    const res = await request("/get_all_teams", "GET");
    if (Array.isArray(res)) {
      setTeams(res);
    } else if (res?.success && Array.isArray(res.data)) {
      setTeams(res.data);
    } else {
      setTeams([]);
      toast({
        title: "Failed to load teams",
        description: res?.msg || "Could not fetch team data from server.",
        variant: "destructive",
      });
    }
  };

  const fetchEventSummary = async () => {
    const res = await request("/event_summary", "GET");
    if (res?.success) {
      setAnalyticsData({
        total_events: res.data.total_events,
        active_events: res.data.active_events,
      });
    } else {
      toast({
        title: "Failed to load analytics",
        description: res?.msg || "Something went wrong while fetching event summary.",
        variant: "destructive",
      });
    }
  };

  const openTeamDialog = (team?: Team) => {
    setTeamDialogOpen(true);
    setEditTeamObj(team || null);
    if (team) {
      setFormData({
        team_name: team.team_name,
        manager_id: String(team.manager_id),
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
    let res;
    if (editTeamObj) {
      res = await request("/update_team", "POST", {
        team_id: editTeamObj.team_id,
        team_name: formData.team_name,
        manager_id: formData.manager_id,
        employee_ids: formData.employees_id,
      });
    } else {
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
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="py-12">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team Id</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Manager</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Members</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams?.map((team) => (
                        <tr key={team.team_id} className="border-b hover:bg-muted/20">
                          <td className="py-3 px-4">{team.team_id}</td>
                          <td className="py-3 px-4">{team.manager_name}</td>
                          <td className="py-3 px-4">{team.team_name}</td>
                          <td className="py-3 px-4">{team.members.length}</td>
                          <td className="py-3 px-4">
                            <Button onClick={() => openTeamDialog(team)} variant="outline">
                              Edit Team
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Single Team Edit Modal */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTeamObj ? "Edit Team" : "Create a New Team"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Team Name */}
            <div>
              <Label htmlFor="team_name">Team Name *</Label>
              <Input
                id="team_name"
                placeholder="Enter team name"
                value={formData.team_name}
                onChange={handleChange}
              />
            </div>

            {/* Manager Selection */}
            <div>
              <Label>Manager *</Label>
              <Select
                value={formData.manager_id}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, manager_id: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.employee_id} value={String(user.employee_id)}>
                        {user.user_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No users available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Employees Multi-Select */}
            <div>
              <Label>Employees *</Label>
              <Command className="border rounded-md">
                <CommandInput placeholder="Search employees..." />
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {users.map((user) => (
                    <CommandItem
                      key={user.employee_id}
                      onSelect={() => toggleEmployee(String(user.employee_id))}
                    >
                      <div
                        className={`flex items-center justify-between w-full ${
                          formData.employees_id.includes(String(user.employee_id))
                            ? "font-semibold text-primary"
                            : ""
                        }`}
                      >
                        <span>{user.user_name}</span>
                        {formData.employees_id.includes(String(user.employee_id)) && (
                          <X className="w-4 h-4" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>

              {/* Selected Employees as Badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.employees_id.map((id) => {
                  const emp = users.find((u) => String(u.employee_id) === id);
                  return (
                    <Badge key={id} className="flex items-center space-x-1" variant="secondary">
                      <span>{emp?.user_name || `User ${id}`}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => toggleEmployee(id)} />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdateTeam} disabled={loading}>
              {loading ? (editTeamObj ? "Updating..." : "Creating...") : editTeamObj ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
