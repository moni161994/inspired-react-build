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
import { Label } from "@/components/ui/label"; // <-- add this import

const initialState = {
  user_name: "",
  email_address: "",
  profile: "",
  teams: "0", // Always 0 by default
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
  const { request, loading } = useApi();
  const { toast } = useToast();

  const isEditMode = !!editingUser;

  useEffect(() => {
    if (editingUser) {
      setUserInfo({
        user_name: editingUser.user_name || "",
        email_address: editingUser.email_address || "",
        profile: editingUser.profile || "",
        teams: "0", // Always 0 in edit mode
        parent_id: editingUser.parent_id?.toString() || "",
        status: editingUser.status?.toString() || "",
      });
    } else {
      setUserInfo(initialState);
    }
  }, [editingUser, open]);

  useEffect(() => {
    const fetchParentUsers = async () => {
      try {
        const res = await request("/get_users", "GET");
        if (res?.status_code === 200 && Array.isArray(res.data)) {
          setAllUsers(res.data);
        }
      } catch (err) {
        // Handle error if needed
      }
    };
    fetchParentUsers();
  }, []);

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

    let res;

    if (isEditMode && editingUser) {
      res = await request("/update_user_details", "POST", {
        employee_id: editingUser.employee_id,
        email_address: userInfo.email_address,
        user_name: userInfo.user_name,
        profile: userInfo.profile,
        teams: "0", // Always 0 in update
        parent_id: userInfo.parent_id,
        status: userInfo.status,
      });

      if (res && res.message) {
        toast({
          title: "User updated successfully",
          description: "User details have been updated successfully.",
        });
        clearEditingUser?.();
        onUserAdded?.();
        onClose();
      } else {
        toast({
          title: "Failed to Update User",
          description: res?.msg || "Something went wrong while updating user.",
          variant: "destructive",
        });
      }
    } else {
      res = await request("/user_details", "POST", {
        ...userInfo,
        teams: "0", // Always 0 in add
      });

      if (res && res.status_code === 200) {
        toast({
          title: "User Added Successfully",
          description: "The new user has been added to the system.",
        });
        setUserInfo(initialState);
        onUserAdded?.();
        onClose();
      } else {
        toast({
          title: "Failed to Add User",
          description: res?.msg || "Something went wrong while adding user.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = () => {
    setUserInfo(initialState);
    clearEditingUser?.();
    onClose();
  };

  const isDisabled = Object.values(userInfo)
    .filter((val, index) => {
      // Ignore teams field in validation since always 0
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
            <Label htmlFor="profile">Profile</Label>
            <Input
              id="profile"
              placeholder="Enter profile..."
              onChange={handleChange}
              value={userInfo.profile}
              name="profile"
              className="border border-gray-300 rounded"
            />
          </div>
          <div>
            <Label htmlFor="parent_id">Parent User</Label>
            <Select value={userInfo.parent_id} onValueChange={handleParentSelect}>
              <SelectTrigger className="border border-gray-300 rounded">
                <SelectValue placeholder="Select Parent User" />
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
