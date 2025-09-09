import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { useApi } from "@/hooks/useApi";

const initialState = {
    user_name: "",
    email_address: "",
    profile: "",
    teams: "",
    parent_id: "",
}

const AddUser = () => {
    const [userInfo, setUserInfo] = useState(initialState);

    const [message, setMessage] = useState<string | null>(null);

    const { request, loading, error } = useApi();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserInfo((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async () => {
        const data = await request("/user_details", "POST", userInfo);

        if (data) {
            setMessage("✅ User added successfully!");
            setUserInfo({
                user_name: "",
                email_address: "",
                profile: "",
                teams: "",
                parent_id: "",
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
                    placeholder="Enter here..."
                    onChange={handleChange}
                    value={userInfo.user_name}
                    name="user_name"
                    label="Username"
                />
                <Input
                    placeholder="Enter here..."
                    onChange={handleChange}
                    value={userInfo.email_address}
                    name="email_address"
                    label="Email Address"
                />
                <Input
                    placeholder="Enter here..."
                    onChange={handleChange}
                    value={userInfo.profile}
                    name="profile"
                    label="Profile"
                />
                <Input
                    placeholder="Enter here..."
                    onChange={handleChange}
                    value={userInfo.teams}
                    name="teams"
                    label="Teams"
                />
                <Input
                    placeholder="Enter here..."
                    onChange={handleChange}
                    value={userInfo.parent_id}
                    name="parent_id"
                    label="Parent ID"
                />

                <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleSubmit}
                    disabled={isDisabled}
                >
                    {loading ? "Submitting..." : "Submit"}
                </Button>

                {message && <p className="text-sm mt-2">{message}</p>}
                {error && <p className="text-sm mt-2 text-red-500">{error}</p>}
            </CardContent>
        </Card>
    );
};

export default AddUser;
