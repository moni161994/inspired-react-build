import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";

const initialState = {
  user_name: "",
  email_address: "",
  profile: "",
  parent_id: "",
  status: "",
};

// --- Types ---
type TeamMember = {
  employee_id: number;
  user_name: string;
  email_address: string;
};

type Team = {
  team_id: number;
  team_name: string;
  manager_id: number; 
  manager_name: string;
  members: TeamMember[];
};

type UserData = {
  employee_id: number;
  email_address: string;
  user_name: string;
  profile: string;
  parent_id: number | string;
  teams: number | string;
  status?: number;
};

type AddUserProps = {
  open: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
  editingUser?: UserData | null;
  clearEditingUser?: () => void;
};

const AddUser = ({
  open,
  onClose,
  onUserAdded,
  editingUser,
  clearEditingUser,
}: AddUserProps) => {
  const [userInfo, setUserInfo] = useState(initialState);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Teams State
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]); // Array for Multi-Select

  const { request, loading } = useApi();
  const { toast } = useToast();

  const isEditMode = !!editingUser;

  // 1. Fetch Reference Data (Teams & Managers)
  useEffect(() => {
    if (open) {
      // Fetch Managers
      const fetchParentUsers = async () => {
        try {
          const res = await request("/get_users", "GET");
          if (res?.status_code === 200 && Array.isArray(res.data)) {
            setAllUsers(res.data);
          }
        } catch (err) {
          console.error(err);
        }
      };

      // Fetch Teams
      const fetchTeams = async () => {
        try {
          const res = await request("/get_all_teams", "GET");
          if (Array.isArray(res)) {
            setTeams(res);
          } else if (res?.status_code === 200 && Array.isArray(res.data)) {
            setTeams(res.data);
          } else {
            setTeams([]);
          }
        } catch (err) {
          console.error(err);
        }
      };

      fetchParentUsers();
      fetchTeams();
    }
  }, [open]);

  // 2. Handle Form Population & Auto-Select Teams
  useEffect(() => {
    if (open && editingUser) {
      // A. Populate Basic Fields
      setUserInfo({
        user_name: editingUser.user_name || "",
        email_address: editingUser.email_address || "",
        profile: editingUser.profile || "",
        parent_id: editingUser.parent_id?.toString() || "",
        status: editingUser.status?.toString() || "",
      });

      // B. Auto-Select Teams (Check ALL teams to see if user is a member)
      if (teams.length > 0) {
        const targetId = Number(editingUser.employee_id);
        
        const userTeams = teams
          .filter(t => t.members?.some(m => m.employee_id === targetId))
          .map(t => String(t.team_id));

        setSelectedTeamIds(userTeams);
      }
    } else if (open && !editingUser) {
      // Reset for Add Mode
      setUserInfo(initialState);
      setSelectedTeamIds([]);
    }
  }, [open, editingUser, teams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleParentSelect = (value: string) => {
    setUserInfo((prev) => ({ ...prev, parent_id: value }));
  };

  const handleStatusChange = (value: string) => {
    setUserInfo((prev) => ({ ...prev, status: value }));
  };

  // Toggle Team Selection
  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  const handleSubmit = async () => {
    // Basic Validation
    if (Object.values(userInfo).some((val) => val.trim() === "")) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all the required fields.",
        variant: "destructive",
      });
      return;
    }

    let userResponse;
    let targetEmployeeId: number | null = null;

    // --- Step 1: Create or Update User ---
    const payload = {
      ...userInfo,
      teams: "0", // Legacy field, safe to send 0 as we handle teams separately
    };

    if (isEditMode && editingUser) {
      userResponse = await request("/update_user_details", "POST", {
        employee_id: editingUser.employee_id,
        ...payload
      });
      targetEmployeeId = editingUser.employee_id;
    } else {
      userResponse = await request("/user_details", "POST", payload);
      
      // Extract ID from create response
      if (userResponse?.status_code === 200) {
         if (userResponse.data && typeof userResponse.data === 'object') {
            targetEmployeeId = userResponse.data.employee_id || userResponse.data.id;
         } else if (typeof userResponse.data === 'number') {
            targetEmployeeId = userResponse.data;
         }
      }
    }

    const isUserSuccess = isEditMode 
      ? (userResponse && userResponse.message) 
      : (userResponse && userResponse.status_code === 200);

    if (!isUserSuccess) {
      toast({
        title: "Error",
        description: userResponse?.msg || "Failed to save user details.",
        variant: "destructive",
      });
      return; 
    }

    // --- Step 2: Sync Teams (Add/Remove User from Multiple Teams) ---
    // We must loop through ALL teams to check if we need to ADD or REMOVE the user
    if (targetEmployeeId && teams.length > 0) {
      const updatePromises = teams.map(async (team) => {
        const teamIdStr = String(team.team_id);
        const isSelected = selectedTeamIds.includes(teamIdStr);
        const isCurrentlyMember = team.members.some(m => m.employee_id === targetEmployeeId);

        let shouldUpdate = false;
        let newMemberIds = team.members.map(m => m.employee_id);

        // Case A: User selected in UI but NOT in DB -> ADD to team
        if (isSelected && !isCurrentlyMember) {
          newMemberIds.push(targetEmployeeId!);
          shouldUpdate = true;
        }
        // Case B: User NOT selected in UI but IS in DB -> REMOVE from team
        else if (!isSelected && isCurrentlyMember) {
          newMemberIds = newMemberIds.filter(id => id !== targetEmployeeId);
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          try {
            await request("/update_team", "POST", {
              team_id: team.team_id,
              team_name: team.team_name,
              manager_id: team.manager_id || 0, // Keep existing manager
              employee_ids: newMemberIds,
            });
            console.log(`Synced team ${team.team_name}: ${isSelected ? 'Added' : 'Removed'} user.`);
          } catch (e) {
            console.error(`Failed to sync team ${team.team_name}`, e);
          }
        }
      });

      await Promise.all(updatePromises);
    }

    // --- Step 3: Cleanup ---
    toast({
      title: "Success",
      description: isEditMode ? "User updated successfully." : "User added successfully.",
    });
    
    if (isEditMode) clearEditingUser?.();
    setUserInfo(initialState);
    setSelectedTeamIds([]);
    onUserAdded?.();
    onClose();
  };

  const handleCancel = () => {
    setUserInfo(initialState);
    setSelectedTeamIds([]);
    clearEditingUser?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <CardContent className="space-y-4 pt-4 px-1">
          {/* Standard Fields */}
          <div>
            <Label htmlFor="user_name">Username</Label>
            <Input
              id="user_name"
              placeholder="Enter username"
              onChange={handleChange}
              value={userInfo.user_name}
              name="user_name"
              className="border-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="email_address">Email</Label>
            <Input
              id="email_address"
              placeholder="Enter email"
              onChange={handleChange}
              value={userInfo.email_address}
              name="email_address"
              className="border-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="profile">Designation</Label>
            <Input
              id="profile"
              placeholder="Enter Designation"
              onChange={handleChange}
              value={userInfo.profile}
              name="profile"
              className="border-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="parent_id">Manager</Label>
            <Select value={userInfo.parent_id} onValueChange={handleParentSelect}>
              <SelectTrigger className="border-gray-400">
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map((user) => (
                  <SelectItem key={user.employee_id} value={String(user.employee_id)}>
                    {user.user_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* MULTI-SELECT TEAMS */}
          <div>
            <Label className="mb-2 block">Assign to Teams</Label>
            <Command className="border border-gray-400 rounded-md">
              <CommandInput placeholder="Search teams..." />
              <CommandEmpty>No teams found.</CommandEmpty>
              <CommandGroup className="max-h-32 overflow-auto">
                {teams.map((team) => {
                  const isSelected = selectedTeamIds.includes(String(team.team_id));
                  return (
                    <CommandItem
                      key={team.team_id}
                      onSelect={() => toggleTeam(String(team.team_id))}
                    >
                      <div className="flex items-center w-full justify-between cursor-pointer">
                         <span>{team.team_name}</span>
                         {isSelected && <Check className="w-4 h-4 text-primary"/>}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
            
            {/* Selected Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTeamIds.map(id => {
                const team = teams.find(t => String(t.team_id) === id);
                return (
                  <Badge key={id} variant="secondary" className="border-gray-400 border pl-2 pr-1 py-0.5 flex items-center gap-1">
                    {team?.team_name || id}
                    <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleTeam(id)} />
                  </Badge>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={userInfo.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="border-gray-400">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="bg-primary hover:bg-primary/90 w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : isEditMode ? "Update User" : "Add User"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
};

export default AddUser;