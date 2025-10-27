import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

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

type Member = {
  user_name: string;
  email_address: string;
};

type Team = {
  team_id: string;
  manager_name: string;
  team_name: string;
  members: Member[];
};

type EventSummary = {
  total_events: number;
  active_events: string;
};

export default function Analytics() {
  const [teams, setTeams] = useState<Team[]>([]);
  const { request, loading } = useApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [analyticsData, setAnalyticsData] = useState<EventSummary | null>(null);
  const { toast } = useToast();

  // ✅ Fetch all teams
  const fetchTeams = async () => {
    const res = await request("/get_all_teams", "GET");
  
    if (Array.isArray(res)) {
      // Case 1: valid response (array)
      if (res.length > 0) {
        setTeams(res);
      } else {
        // Case 2: valid response but no data
        setTeams([]);
        toast({
          title: "No Teams Found",
          description: "No team data is available at the moment.",
          variant: "default",
        });
      }
    } else if (res?.success && Array.isArray(res.data)) {
      // Case 3: API wrapped response like { success: true, data: [...] }
      if (res.data.length > 0) {
        setTeams(res.data);
      } else {
        setTeams([]);
        toast({
          title: "No Teams Found",
          description: "No team data is available at the moment.",
          variant: "default",
        });
      }
    } else {
      // Case 4: unexpected / failed response
      toast({
        title: "Failed to load teams",
        description: res?.msg || "Could not fetch team data from server.",
        variant: "destructive",
      });
    }
  };
  
  

  // ✅ Fetch event summary (total + active)
  const fetchEventSummary = async () => {
    const res = await request("/event_summary", "GET");

    if (res?.success) {
      setAnalyticsData({
        total_events: res.data.total_events,
        active_events: res.data.active_events,
      });
    } else {
      toast({
        title: "Failed to load analytics",
        description:
          res?.msg || "Something went wrong while fetching event summary.",
        variant: "destructive",
      });
    }
  };

  // ✅ Initialize both APIs together
  const initializeData = async () => {
    await Promise.all([fetchTeams(), fetchEventSummary()]);
  };

  useEffect(() => {
    initializeData();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <Tabs defaultValue="analytics-overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analytics-overview">
                Analytics Overview
              </TabsTrigger>
              <TabsTrigger value="team-analytics">Team Analytics</TabsTrigger>
            </TabsList>

            {/* ✅ Overview Tab */}
            <TabsContent value="analytics-overview" className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-foreground">
                  All Teams Analytics Overview
                </h1>
              </div>

              {/* ✅ Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          {analyticsData?.total_events ?? 0}
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end space-x-4">
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          {analyticsData?.active_events ?? 0}
                        </div>
                      </div>
                      <div className="flex-1 h-16 bg-gradient-to-r from-green-200 to-green-400 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-1/3 h-12 bg-green-500 rounded-sm"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ✅ Top Events + Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performing Events */}
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
                              <td className="py-2 text-foreground">
                                {event.team}
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

                {/* Top Performing Members */}
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

            {/* ✅ Team Analytics */}
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
                          {teams?.map((lead: Team) => (
                            <tr
                              key={lead.team_id}
                              className="border-b hover:bg-muted/20"
                            >
                              <td className="py-3 px-4 text-foreground">
                                {lead.team_id}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                {lead.manager_name}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                {lead.team_name}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                {lead.members.length}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  onClick={() => {
                                    setSelectedMembers(lead.members);
                                    setSelectedTeamName(lead.team_name);
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

            {/* ✅ Modal for Team Members */}
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
          </Tabs>
        </main>
      </div>
    </div>
  );
}
