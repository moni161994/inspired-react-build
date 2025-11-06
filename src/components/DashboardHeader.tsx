import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { logout } from "@/hooks/auth";
import { useEventDialog } from "@/contexts/EventDialogContext";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type User = {
  employee_id: number;
  user_name: string;
};

export function DashboardHeader() {
  const navigate = useNavigate();
  const { openEventDialog } = useEventDialog();
  const { request } = useApi();
  const { toast } = useToast();

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    team_name: "",
    manager_id: "",
    employees_id: [] as string[],
  });

  // ✅ Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await request("/get_users", "GET");
        if (Array.isArray(res?.data)) {
          setUsers(res?.data);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);
  console.log("users", users);
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // ✅ Add/remove employee IDs for multi-select
  const toggleEmployee = (id: string) => {
    setFormData((prev) => {
      const exists = prev.employees_id.includes(id);
      const updated = exists
        ? prev.employees_id.filter((emp) => emp !== id)
        : [...prev.employees_id, id];
      return { ...prev, employees_id: updated };
    });
  };

  const handleCreateTeam = async () => {
    const { team_name, manager_id, employees_id } = formData;

    if (!team_name || !manager_id || employees_id?.length === 0) {
      toast({
        variant: "destructive",
        title: "⚠️ Missing Required Fields",
        description: "Please fill all required fields.",
      });
      return;
    }

    setLoading(true);
    const res = await request("/create_team", "POST", {
      team_name,
      manager_id,
      employees_id,
    });
    setLoading(false);

    if (res?.message === "Team created successfully") {
      toast({
        title: "✅ Team Created",
        description: "Your team has been created successfully.",
      });
      setTeamDialogOpen(false);
      setFormData({ team_name: "", manager_id: "", employees_id: [] });
      //  navigate("");
      window.location.href = "/team"
    } else {
      toast({
        variant: "destructive",
        title: "❌ Failed to Create Team",
        description: res?.msg || "An unexpected error occurred.",
      });
    }
  };

  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">Eprevent Admin</h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          {/* <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Team Search..."
              className="w-64 pl-10 bg-background border-border"
            />
          </div> */}

          {/* Add New Team */}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setTeamDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Team
          </Button>

          {/* Add New Event */}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={openEventDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Event
          </Button>

          {/* Logout */}
          <Button variant="outline" onClick={handleLogout}>
            LogOut
          </Button>
        </div>
      </header>

      {/* Add Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a New Team</DialogTitle>
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
                  {users?.length > 0 ? (
                    users?.map((user) => (
                      <SelectItem
                        key={user.employee_id}
                        value={String(user.employee_id)}
                      >
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
                  {users?.map((user) => (
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
                {formData?.employees_id?.map((id) => {
                  const emp = users?.find((u) => String(u.employee_id) === id);
                  return (
                    <Badge
                      key={id}
                      className="flex items-center space-x-1"
                      variant="secondary"
                    >
                      <span>{emp?.user_name || `User ${id}`}</span>
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => toggleEmployee(id)}
                      />
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
            <Button onClick={handleCreateTeam} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
