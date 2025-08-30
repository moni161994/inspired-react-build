import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const users = [
  {
    name: "Laura Venetucci",
    email: "laura@onbeat.digital",
    profile: "INTEGRATION",
    teams: 1,
    parents: 0
  },
  {
    name: "Leonie Van der Meulen",
    email: "leonie.vandermeulen@eu.phchd.com",
    profile: "SUPERUSER",
    teams: 1,
    parents: 0
  },
  {
    name: "Karen Trice",
    email: "karen.trice@epredia.com",
    profile: "SUPERUSER",
    teams: 2,
    parents: 1
  },
  {
    name: "Kei Sato",
    email: "kei.sato@phchd.com",
    profile: "EVTMGR",
    teams: 1,
    parents: 0
  },
  {
    name: "Rachel Rosenblum",
    email: "rachel.rosenblum@epredia.com",
    profile: "EVTMGR",
    teams: 1,
    parents: 0,
    notVerified: true
  },
  {
    name: "Beate Rätz",
    email: "beate.raetz@epredia.com",
    profile: "EVTMGR",
    teams: 1,
    parents: 0
  },
  {
    name: "Sophia Oberlander",
    email: "sophia.hifai@epredia.com",
    profile: "EVTMGR",
    teams: 1,
    parents: 0
  }
];

export default function Users() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Parent & Team Users</h1>
            <p className="text-muted-foreground">Manage Users for Parent & Team Accounts</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Search Users:</span>
                  <Input className="w-64" />
                </div>
                
                <div className="space-y-4">
                  <div className="text-lg font-medium">Add New User</div>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="User Email" className="w-64" />
                    <Button className="bg-primary hover:bg-primary/90">Check Email</Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Profile</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Teams</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Parents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr 
                        key={index} 
                        className={`border-b hover:bg-muted/50 ${user.notVerified ? 'bg-destructive/10' : ''}`}
                      >
                        <td className="py-3 text-foreground">{user.name}</td>
                        <td className="py-3 text-foreground">{user.email}</td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={
                                user.profile === 'INTEGRATION' ? 'secondary' :
                                user.profile === 'SUPERUSER' ? 'default' :
                                'outline'
                              }
                            >
                              {user.profile}
                            </Badge>
                            {user.notVerified && (
                              <Badge variant="destructive">NOT VERIFIED</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-foreground">{user.teams}</td>
                        <td className="py-3 text-foreground">{user.parents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}