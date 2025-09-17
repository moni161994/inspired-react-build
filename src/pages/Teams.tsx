import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";

const teamsData = {
  totalEvents: 265,
  totalLeads: 5176,
  priorityLeads: 297,
  avgLeadsPerEvent: 19.53,
  priorityPercentage: "5.74%"
};

export default function Teams() {
  const { request, loading, error } = useApi<any>();
  const [leadData, setLeadData] = useState<any>(null);

  const fetchLeadData = async () => {
    const res = await request(
      `/get_all_leads`,
      "GET"
    );
    if (res && res.success === true && res.data) {
      setLeadData(res.data);
    }
  };
  
  useEffect(() => {
    fetchLeadData();
  }, []);

    const handleDelete = async (lead_id: any) => {
      try {
        const res = await request(
          `/delete_lead?lead_id=${lead_id}`,
          "DELETE"
        );
    
        if (res && res.success === true) {
          setLeadData((prev: any[]) => prev.filter((lead:any) => lead.lead_id !== lead_id));
        } else {
          alert("Failed to delete lead");
        }
      } catch (err) {
        alert("Something went wrong while deleting");
      }
    
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">epredia</h1>
            <p className="text-muted-foreground mb-4">Here is your Lead Data</p>
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
                    <div className="text-3xl font-bold text-foreground">{leadData?.length}</div>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Company Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Designation</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone Number</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadData?.map((lead: any) => (
                      <tr key={lead?.lead_id} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-foreground font-medium">{lead?.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground">{lead?.company}</td>
                        <td className="py-3 px-4 text-foreground">{lead?.designation}</td>
                        <td className="py-3 px-4 text-foreground">{lead?.phone_numbers[0]}</td>
                        <td className="py-3 px-4 text-foreground">{lead?.emails[0]}</td>
                        <td className="py-3 px-4">
                          <Button onClick={()=> handleDelete(lead?.lead_id)} variant="link" className="text-primary p-0 h-auto">
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card> 

          {/* <Card>
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
          </Card> */}

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">© iCapture 2025</p>
          </div>
        </main>
      </div>
    </div>
  );
}