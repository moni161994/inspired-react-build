import { useState } from "react";
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

type AddUserProps = {
  onUserAdded?: () => void;
};

const AddUser = ({ onUserAdded }: AddUserProps) => {
  const [userInfo, setUserInfo] = useState(initialState);
  const { request, loading, error } = useApi();
  const { toast } = useToast();

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

    const data = await request("/user_details", "POST", userInfo);

    if (data && data.status_code === 200) {
      toast({
        title: "User Added Successfully",
        description: "The new user has been added to the system.",
      });
      setUserInfo(initialState);
      if (onUserAdded) onUserAdded();
    } else {
      toast({
        title: "Failed to Add User",
        description: data?.msg || "Something went wrong while adding the user.",
        variant: "destructive",
      });
    }
  };

  const isDisabled = Object.values(userInfo).some((val) => val.trim() === "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New User</CardTitle>
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

        <Button
          className="bg-primary hover:bg-primary/90 w-full"
          onClick={handleSubmit}
          disabled={isDisabled || loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddUser;
