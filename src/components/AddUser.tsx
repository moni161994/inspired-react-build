import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { CardContent } from "./ui/card";
import { Input } from "./ui/input";
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
import { Label } from "@/components/ui/label";

const initialState = {
  user_name: "",
  email_address: "",
  profile: "",
  teams: "0", // Always 0 by default for user_details API
  parent_id: "",
  status: "",
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

// Types based on your API response
type TeamMember = {
  employee_id: number;
  user_name: string;
  email_address: string;
};

type Team = {
  team_id: number;
  team_name: string;
  manager_name: string;
  members: TeamMember[];
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
  
  // New State for Teams
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("0");

  const { request, loading } = useApi();
  const { toast } = useToast();

  const isEditMode = !!editingUser;

  // 1. Fetch Users (Managers)
  useEffect(() => {
    const fetchParentUsers = async () => {
      try {
        const res = await request("/get_users", "GET");
        if (res?.status_code === 200 && Array.isArray(res.data)) {
          setAllUsers(res.data);
        }
      } catch (err) {
        console.error("fetchParentUsers error", err);
      }
    };
    fetchParentUsers();
  }, []);

  // 2. Fetch Teams
  useEffect(() => {
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
    fetchTeams();
  }, []);

  // 3. Handle Edit Mode Population & AUTO SELECT TEAM
  useEffect(() => {
    if (open && editingUser) {
      // A. Set Basic Info
      setUserInfo({
        user_name: editingUser.user_name || "",
        email_address: editingUser.email_address || "",
        profile: editingUser.profile || "",
        teams: "0", 
        parent_id: editingUser.parent_id?.toString() || "",
        status: editingUser.status?.toString() || "",
      });

      // B. AUTO-SELECT TEAM Logic
      // Scan all teams to see if this user is a member of any of them
      if (teams.length > 0) {
        const foundTeam = teams.find((t) => 
          t.members.some((m) => m.employee_id === Number(editingUser.employee_id))
        );

        if (foundTeam) {
          setSelectedTeamId(String(foundTeam.team_id));
        } else {
          setSelectedTeamId("0");
        }
      }
    } else if (open && !editingUser) {
      // Reset for Add Mode
      setUserInfo(initialState);
      setSelectedTeamId("0");
    }
  }, [editingUser, open, teams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleParentSelect = (value: string) => {
    setUserInfo((prev) => ({
      ...prev,
      parent_id: value,
    }));
  };

  const handleStatusChange = (value: string) => {
    setUserInfo((prev) => ({
      ...prev,
      status: value,
    }));
  };

  const handleSubmit = async () => {
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
    if (isEditMode && editingUser) {
      userResponse = await request("/update_user_details", "POST", {
        employee_id: editingUser.employee_id,
        email_address: userInfo.email_address,
        user_name: userInfo.user_name,
        profile: userInfo.profile,
        teams: "0",
        parent_id: userInfo.parent_id,
        status: userInfo.status,
      });
      targetEmployeeId = editingUser.employee_id;
    } else {
      userResponse = await request("/user_details", "POST", {
        ...userInfo,
        teams: "0",
      });
      
      // Attempt to extract the new ID from response
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
        title: isEditMode ? "Failed to Update User" : "Failed to Add User",
        description: userResponse?.msg || "Something went wrong.",
        variant: "destructive",
      });
      return; 
    }

    // --- Step 2: Add to Team (if team selected) ---
    if (selectedTeamId && selectedTeamId !== "0" && targetEmployeeId) {
      try {
        const teamToUpdate = teams.find(t => t.team_id === Number(selectedTeamId));
        
        if (teamToUpdate) {
          // 1. Get existing member IDs
          const employeeIds = teamToUpdate.members.map(m => m.employee_id);
          
          // 2. Add new user if not already in list
          if (!employeeIds.includes(targetEmployeeId)) {
            employeeIds.push(targetEmployeeId);
          }

          // 3. Find Manager ID based on Manager Name
          const managerUser = allUsers.find(u => u.user_name === teamToUpdate.manager_name);
          const managerId = managerUser ? managerUser.employee_id : 0; 

          // 4. Call API
          await request("/update_team", "POST", {
            team_id: teamToUpdate.team_id,
            team_name: teamToUpdate.team_name,
            manager_id: managerId, 
            employee_ids: employeeIds, // Send updated array
          });
          
          console.log(`User ${targetEmployeeId} added to team ${teamToUpdate.team_name}`);
        }
      } catch (teamErr) {
        console.error("Failed to update team membership", teamErr);
        toast({
          title: "User Saved but Team Update Failed",
          description: "Could not add user to the selected team.",
          variant: "destructive"
        });
      }
    }

    // --- Step 3: Cleanup ---
    toast({
      title: isEditMode ? "User Updated" : "User Added",
      description: "Operation completed successfully.",
    });
    
    if (isEditMode) clearEditingUser?.();
    setUserInfo(initialState);
    setSelectedTeamId("0");
    onUserAdded?.();
    onClose();
  };

  const handleCancel = () => {
    setUserInfo(initialState);
    setSelectedTeamId("0");
    clearEditingUser?.();
    onClose();
  };

  const isDisabled = Object.values(userInfo)
    .filter((val, index) => {
      // Ignore teams field (index 3) in validation since always 0 in userInfo
      return index !== 3;
    })
    .some((val) => val.trim() === "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <CardContent className="space-y-4 pt-4">
          <div>
            <Label htmlFor="user_name">Username</Label>
            <Input
              id="user_name"
              placeholder="Enter username..."
              onChange={handleChange}
              value={userInfo.user_name}
              name="user_name"
              className="border border-gray-300 rounded"
            />
          </div>
          <div>
            <Label htmlFor="email_address">Email</Label>
            <Input
              id="email_address"
              placeholder="Enter email..."
              onChange={handleChange}
              value={userInfo.email_address}
              name="email_address"
              className="border border-gray-300 rounded"
            />
          </div>
          <div>
            <Label htmlFor="profile">Designation</Label>
            <Input
              id="profile"
              placeholder="Enter Designation..."
              onChange={handleChange}
              value={userInfo.profile}
              name="profile"
              className="border border-gray-300 rounded"
            />
          </div>
          <div>
            <Label htmlFor="parent_id">Manager</Label>
            <Select value={userInfo.parent_id} onValueChange={handleParentSelect}>
              <SelectTrigger className="border border-gray-300 rounded">
                <SelectValue placeholder="Select Manager User" />
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
          
          {/* New Team Selection Field */}
          <div>
            <Label htmlFor="team">Assign to Team</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="border border-gray-300 rounded">
                <SelectValue placeholder="Select Team (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.team_id} value={String(team.team_id)}>
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={userInfo.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="border border-gray-300 rounded">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="bg-primary hover:bg-primary/90 w-full"
              onClick={handleSubmit}
              disabled={isDisabled || loading}
            >
              {loading
                ? "Submitting..."
                : isEditMode
                ? "Update User"
                : "Add User"}
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