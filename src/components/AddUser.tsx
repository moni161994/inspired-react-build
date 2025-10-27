import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";

const initialState = {
  user_name: "",
  email_address: "",
  profile: "",
  teams: "",
  parent_id: "",
};

type UserData = {
  employee_id: number;
  email_address: string;
  user_name: string;
  profile: string;
  parent_id: number;
  teams: number | string;
  status?: number;
};

type AddUserProps = {
  onUserAdded?: () => void;
  editingUser?: UserData | null;
  clearEditingUser?: () => void;
};

const AddUser = ({ onUserAdded, editingUser, clearEditingUser }: AddUserProps) => {
  const [userInfo, setUserInfo] = useState(initialState);
  const { request, loading } = useApi();
  const { toast } = useToast();

  const isEditMode = !!editingUser;

  // 🟢 Prefill when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setUserInfo({
        user_name: editingUser.user_name || "",
        email_address: editingUser.email_address || "",
        profile: editingUser.profile || "",
        teams: editingUser.teams?.toString() || "",
        parent_id: editingUser.parent_id?.toString() || "",
      });
    } else {
      setUserInfo(initialState);
    }
  }, [editingUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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

    let data;

    if (isEditMode && editingUser) {
      // 🟢 Update user
      data = await request("/update_user", "POST", {
        employee_id: editingUser.employee_id,
        ...userInfo,
      });

      if (data && data.status_code === 200) {
        toast({
          title: "User Updated Successfully",
          description: "The user details have been updated.",
        });
        clearEditingUser?.();
      } else {
        toast({
          title: "Failed to Update User",
          description: data?.msg || "Something went wrong while updating user.",
          variant: "destructive",
        });
      }
    } else {
      // 🟢 Add new user
      data = await request("/user_details", "POST", userInfo);

      if (data && data.status_code === 200) {
        toast({
          title: "User Added Successfully",
          description: "The new user has been added to the system.",
        });
        setUserInfo(initialState);
      } else {
        toast({
          title: "Failed to Add User",
          description: data?.msg || "Something went wrong while adding user.",
          variant: "destructive",
        });
      }
    }

    if (onUserAdded) onUserAdded();
  };

  const handleCancel = () => {
    setUserInfo(initialState);
    clearEditingUser?.();
  };

  const isDisabled = Object.values(userInfo).some((val) => val.trim() === "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit User" : "Add New User"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter username..."
          onChange={handleChange}
          value={userInfo.user_name}
          name="user_name"
        />
        <Input
          placeholder="Enter email..."
          onChange={handleChange}
          value={userInfo.email_address}
          name="email_address"
          disabled={isEditMode} // prevent changing email in edit mode if needed
        />
        <Input
          placeholder="Enter profile..."
          onChange={handleChange}
          value={userInfo.profile}
          name="profile"
        />
        <Input
          placeholder="Enter team..."
          onChange={handleChange}
          value={userInfo.teams}
          name="teams"
        />
        <Input
          placeholder="Enter parent ID..."
          onChange={handleChange}
          value={userInfo.parent_id}
          name="parent_id"
        />

        <div className="flex gap-2">
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

          {isEditMode && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddUser;
