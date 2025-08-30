import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const teamsData = {
  totalEvents: 265,
  totalLeads: 5176,
  priorityLeads: 297,
  avgLeadsPerEvent: 19.53,
  priorityPercentage: "5.74%"
};

const teams = [
  {
    name: "PHC",
    color: "bg-purple-400",
    totalEvents: 141,
    totalLeads: 594,
    priorityLeads: 297
  },
  {
    name: "epredia", 
    color: "bg-gray-400",
    totalEvents: 124,
    totalLeads: 4582,
    priorityLeads: 0
  }
];

export default function Teams() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">epredia</h1>
            <p className="text-muted-foreground mb-4">Here is a quick snapshot of your teams.</p>
            
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-sm text-muted-foreground">Your key stats for the</span>
              <Select defaultValue="all-time">
                <SelectTrigger className="w-32 h-auto py-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-time">all Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{teamsData.totalEvents}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Including 88 events with no leads
                    </div>
                  </div>
                  <div className="flex-1 h-16 bg-gradient-to-r from-blue-200 to-blue-400 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-full h-12 bg-blue-500 rounded-sm"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{teamsData.totalLeads}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Avg. {teamsData.avgLeadsPerEvent} leads per event
                    </div>
                  </div>
                  <div className="flex-1 h-16 bg-gradient-to-r from-blue-200 to-blue-400 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-3/4 h-14 bg-blue-500 rounded-sm"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Priority Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{teamsData.priorityLeads}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {teamsData.priorityPercentage} of all leads
                    </div>
                  </div>
                  <div className="flex-1 h-16 bg-gradient-to-r from-green-200 to-green-400 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-1/3 h-10 bg-green-500 rounded-sm"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total Events</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total Leads</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Priority Leads</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${team.color}`}></div>
                            <span className="text-foreground font-medium">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground">{team.totalEvents}</td>
                        <td className="py-3 px-4 text-foreground">{team.totalLeads}</td>
                        <td className="py-3 px-4 text-foreground">{team.priorityLeads}</td>
                        <td className="py-3 px-4">
                          <Button variant="link" className="text-primary p-0 h-auto">
                            Analytics
                          </Button>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="link" className="text-primary p-0 h-auto">
                            Log In
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">© iCapture 2025</p>
          </div>
        </main>
      </div>
    </div>
  );
}