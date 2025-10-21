import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AddUser from "@/components/AddUser";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type UserData = {
  employee_id: number;
  email_address: string;
  user_name: string;
  profile: string;
  parent_id: number;
  teams: number;
  status: number;
};

export default function Users() {
  const { request, loading, error } = useApi<any>();
  const [user, setUser]: any = useState<UserData[] | null>(null);
  const { toast } = useToast();

  const fetchUser = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const res = await request(`/get_users`, "GET");
    if (res && res.status_code === 200 && res.data) {
      setUser(res.data);
    } else {
      toast({
        title: "Failed to fetch users",
        description: "An error occurred while fetching user data.",
        variant: "destructive",
      });
    }
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

    const res = await request("/generate_otp", "POST", {
      email_id: email,
    });

    if (res?.message === "OTP sent successfully") {
      toast({
        title: "Success",
        description: "OTP has been sent to the user’s email!",
      });
    } else {
      toast({
        title: "Failed",
        description: res?.msg || "Something went wrong while sending OTP.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

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

          <div className="grid grid-cols-[7fr_3fr] gap-4">
            <Card>
              <CardHeader className="flex justify-between flex-row space-y-0 items-center">
                <CardTitle>User Management</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Search Users:
                  </span>
                  <Input className="w-64" placeholder="Search..." />
                </div>
              </CardHeader>

              <CardContent>
                {loading && <p>Loading user...</p>}
                {error && (
                  <p className="text-red-500">
                    {typeof error === "string" ? error : "Something went wrong"}
                  </p>
                )}

                {!loading && !error && user && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            ID
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Name
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Profile
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Teams
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Parent
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Generate Code
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.map((data: any) => (
                          <tr
                            key={data.employee_id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-4 text-foreground">
                              {data.employee_id}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {data.user_name}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {data.email_address}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{data.profile}</Badge>
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {data.teams}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {data.parent_id}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {data.status === 1 ? "Active" : "Inactive"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center">
                                <Button
                                  className="bg-primary hover:bg-primary/90"
                                  onClick={() => sendCode(data.email_address)}
                                >
                                  Generate Code
                                </Button>
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

            {/* Right-side Add User card */}
            <AddUser onUserAdded={fetchUser} />
          </div>

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">© iCapture 2025</p>
          </div>
        </main>
      </div>
    </div>
  );
}
