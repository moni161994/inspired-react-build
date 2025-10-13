import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Download } from "lucide-react";
import Teams from "./Teams";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";

const analyticsData = {
  totalEvents: 37,
  totalLeads: 271,
  priorityLeads: 62,
  avgLeadsPerEvent: 7,
  priorityPercentage: "23%",
};

const topEvents = [
  {
    name: "2025 JSCC66 Annual Meeting",
    team: "epredia",
    totalLeads: 48,
    priorityLeads: "N/A",
  },
  {
    name: "ADLM 2025",
    team: "epredia",
    totalLeads: 36,
    priorityLeads: "N/A",
  },
];

const topMembers = [
  {
    name: "Ashley Shih",
    totalLeads: "7%",
    priorityLeads: "31%",
  },
  {
    name: "Rachel iCapture",
    totalLeads: "7%",
    priorityLeads: "",
  },
];

// const teams = [{
//   name:"monika",
//   company:"tradeindia",
//   designation: "developer",
//   phone_no:"9176657835",
// email:"dcjbdickjf"
// },
// {
//   name:"monika",
//   company:"tradeindia",
//   designation: "developer",
//   phone_no:"9176657835",
// email:"dcjbdickjf"
// }]

export default function Analytics() {
  const [teams, setTeams] = useState<Event[]>([]);
  const { request, loading, error } = useApi<Event[]>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await request("/get_all_teams", "GET");
      if (data) {
        setTeams(data);
      }
    };

    fetchEvents();
  }, []);
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <Tabs defaultValue="analytics-overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analytics-overview">
                Analytics Overview
              </TabsTrigger>
              <TabsTrigger value="team-analytics">Team Analytics</TabsTrigger>
              <TabsTrigger value="events-overview">Events Overview</TabsTrigger>
              {/* <TabsTrigger value="team-performance">
                Team Performance
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="analytics-overview" className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-foreground">
                  All Teams Analytics Overview
                </h1>

                <div className="flex items-center space-x-4">
                  <Select defaultValue="last-3-months">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-3-months">
                        Last 3 Months
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                  </Button>

                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Data
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end space-x-4">
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          {analyticsData.totalEvents}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Including 20 events with no leads
                        </div>
                      </div>
                      <div className="flex-1 h-16 bg-gradient-to-r from-blue-200 to-blue-400 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-blue-500 rounded-sm"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Leads
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end space-x-4">
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          {analyticsData.totalLeads}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Avg. {analyticsData.avgLeadsPerEvent} leads per event
                        </div>
                      </div>
                      <div className="flex-1 h-16 bg-gradient-to-r from-blue-200 to-blue-400 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-1/3 h-12 bg-blue-500 rounded-sm"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Priority Leads
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end space-x-4">
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          {analyticsData.priorityLeads}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {analyticsData.priorityPercentage} of all leads
                        </div>
                      </div>
                      <div className="flex-1 h-16 bg-gradient-to-r from-green-200 to-green-400 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-1/4 h-10 bg-green-500 rounded-sm"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                              Event
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                              Team
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                              Total Leads
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                              Priority Leads
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {topEvents.map((event, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 text-foreground">
                                {event.name}
                              </td>
                              <td className="py-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                  <span className="text-foreground">
                                    {event.team}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 text-foreground">
                                {event.totalLeads}
                              </td>
                              <td className="py-2 text-foreground">
                                {event.priorityLeads}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                              Team Member
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                              Total Leads
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                              Priority Leads
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {topMembers.map((member, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-primary-foreground text-sm font-medium">
                                      {member.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </span>
                                  </div>
                                  <span className="text-foreground">
                                    {member.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 text-foreground">
                                {member.totalLeads}
                              </td>
                              <td className="py-2 text-foreground">
                                {member.priorityLeads}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team-analytics">
              <div className="py-12">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Team Id
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Team Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Members
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Show Members Name
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams?.map((lead: any) => (
                            <tr
                              key={lead?.lead_id}
                              className="border-b hover:bg-muted/20"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-foreground font-medium">
                                    {lead?.team_id}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                {lead?.manager_name}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                {lead?.team_name}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                {lead?.members.length}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                <Button
                                  onClick={() => {
                                    setSelectedMembers(lead?.members);
                                    setSelectedTeamName(lead?.team_name);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  View Members
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                      Members of {selectedTeamName}
                    </h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-500 hover:text-black"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedMembers.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedMembers.map((member, index) => (
                        <li key={index} className="border p-2 rounded">
                          <p className="font-medium">{member.user_name}</p>
                          <p className="text-sm text-gray-500">
                            {member.email_address}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No members found.</p>
                  )}
                </div>
              </div>
            )}

            <TabsContent value="events-overview">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Events Overview
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Content coming soon...
                </p>
              </div>
            </TabsContent>

            {/* <TabsContent value="team-performance">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Team Performance
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Content coming soon...
                </p>
              </div>
            </TabsContent> */}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
