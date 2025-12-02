import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DateInput } from "@/components/ui/DateInput";

type Member = {
  employee_id: string;
  user_name: string;
  email_address: string;
};
type Team = {
  team_id: string;
  manager_id: string;
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
  const [users, setUsers] = useState<Member[]>([]);
  const [analyticsData, setAnalyticsData] = useState<EventSummary | null>(null);
  const [templateUsage, setTemplateUsage] = useState([]);
  const [activityReport, setActivityReport] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [startDateTemplate, setStartDateTemplate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endDateTemplate, setEndDateTemplate] = useState("");
  const [startDateEvent, setStartDateEvent] = useState("");
  const [endDateEvent, setEndDateEvent] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState([]);
  const [employeeReport, setEmployeeReport] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { request, loading } = useApi();
  const { toast } = useToast();

  // Modal states
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editTeamObj, setEditTeamObj] = useState<Team | null>(null);

  // Modal form state
  const [formData, setFormData] = useState({
    team_name: "",
    manager_id: "",
    employees_id: [] as string[], // array of strings
  });

  const filteredReport = employeeReport.filter((row: any) =>
    row.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    fetchEventSummary();
    // fetchTemplateUsage();
    fetchEvents(); // 👈 Add here
  }, []);

  useEffect(() => {
    fetchActivityReport();
  }, [startDate, endDate]);

  useEffect(() => {
    fetchTemplateUsage();
  }, [startDateTemplate, endDateTemplate]);

  const handleClearDate = () => {
    setEndDate("");
    setStartDate("");
  };

  const handleClearDateforEvent = () => {
    setEndDateEvent("");
    setStartDateEvent("");
    setEventId("");
  };

  const handleClearDateTemplate = () => {
    setEndDateTemplate("");
    setStartDateTemplate("")
  }

  const fetchTemplateUsage = async () => {
    // const res = await request("/template_usage_count", "GET");
    const res = await request(
      `/template_usage_count?${startDateTemplate ? `start_date=${startDateTemplate}` : ""
      }${endDateTemplate ? `&end_date=${endDateTemplate}` : ""}`, "GET"
    );
    if (res?.success && Array.isArray(res.data)) {
      setTemplateUsage(res?.data);
    }
  };

  useEffect(() => {
    fetchEmployeeActivity();
  }, [startDateEvent, endDateEvent, eventId]);

  const fetchEmployeeActivity = async () => {
    try {
      const res = await fetch(
        `https://api.inditechit.com/employee_activity_report?${startDateEvent ? `startDate=${startDateEvent}` : ""
        }${endDateEvent ? `&endDate=${endDateEvent}` : ""}${eventId ? `&event_id=${eventId}` : ""
        }`
      );
      const result = await res.json();
      setEmployeeReport(result?.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchEvents = async () => {
    const data: any = await request("/get_all_event_details", "GET");
    if (data?.data) setEvents(data.data);
    else setEvents([]);
  };

  const fetchActivityReport = async () => {
    let res: any;
    if (startDate || endDate) {
      res = await request(
        `/team_activity_report?startDate=${startDate}&endDate=${endDate}`,
        "GET"
      );
    } else {
      res = await request(`/team_activity_report?`, "GET");
    }

    if (res?.success && Array.isArray(res.data)) {
      const grouped = res.data.reduce((acc: any, item: any) => {
        acc[item.team] = (acc[item.team] || 0) + item.total_leads;
        return acc;
      }, {});

      const graphData = Object.keys(grouped).map((team) => ({
        team,
        total_leads: grouped[team],
      }));

      setActivityReport(graphData);
    } else {
      toast({
        title: "Failed to load team activity report",
        description: res?.msg || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    const res = await request("/get_users", "GET");
    setUsers(Array.isArray(res?.data) ? res.data : []);
  };

  const fetchTeams = async () => {
    const res = await request("/get_all_teams", "GET");
    if (Array.isArray(res)) {
      setTeams(res);
    } else if (res?.success && Array.isArray(res.data)) {
      setTeams(res.data);
    } else {
      setTeams([]);
      toast({
        title: "Failed to load teams",
        description: res?.msg || "Could not fetch team data from server.",
        variant: "destructive",
      });
    }
  };

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

  // Open edit modal and preload form
  const openTeamDialog = (team?: Team) => {
    setTeamDialogOpen(true);
    setEditTeamObj(team || null);
    if (team) {
      setFormData({
        team_name: team.team_name,
        manager_id: String(team.manager_id),
        employees_id: team.members.map((m) => String(m.employee_id)),
      });
    } else {
      setFormData({ team_name: "", manager_id: "", employees_id: [] });
    }
  };

  // Toggle employee selection multi-select
  const toggleEmployee = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      employees_id: prev.employees_id.includes(id)
        ? prev.employees_id.filter((eid) => eid !== id)
        : [...prev.employees_id, id],
    }));
  };

  // Handle inputs change in form
  const handleChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // Create or update submit handler
  const handleCreateOrUpdateTeam = async () => {
    if (
      !formData.team_name.trim() ||
      !formData.manager_id ||
      formData.employees_id.length === 0
    ) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    let res;
    if (editTeamObj) {
      res = await request("/update_team", "POST", {
        team_id: editTeamObj.team_id,
        team_name: formData.team_name,
        manager_id: formData.manager_id,
        employee_ids: formData.employees_id,
      });
    } else {
      // No create button inside UI, so unlikely to come here, but logic kept for completeness
      res = await request("/create_team", "POST", {
        team_name: formData.team_name,
        manager_id: formData.manager_id,
        employee_ids: formData.employees_id,
      });
    }
    if (res?.success || res?.message?.includes("success")) {
      toast({ title: editTeamObj ? "Team updated" : "Team created" });
      setTeamDialogOpen(false);
      setEditTeamObj(null);
      fetchTeams();
    } else {
      toast({
        title: "Operation failed",
        description: res?.error || res?.msg || "Server error",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCSV = () => {
    if (!employeeReport || employeeReport.length === 0) {
      toast({
        title: "No data available",
        description: "Employee activity report is empty.",
        variant: "destructive",
      });
      return;
    }

    // CSV Headers
    const headers = [
      "Employee ID",
      "Employee Name",
      "Event Name",
      "Lead Date",
      "Total Leads",
    ];

    // Convert rows
    const rows = employeeReport.map((row: any) => [
      row.employee_id,
      row.user_name,
      row.event_name,
      new Date(row.lead_date).toLocaleDateString(),
      row.total_leads,
    ]);

    // Prepare CSV string
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    // Trigger file download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee_activity_report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <Tabs defaultValue="analytics-overview" className="w-full">
            {/* <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analytics-overview">Analytics Overview</TabsTrigger>
              <TabsTrigger value="team-analytics">Team Analytics</TabsTrigger>
            </TabsList> */}

            <TabsContent value="analytics-overview" className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-foreground">
                  All Teams Analytics Overview
                </h1>
              </div>

              {/* Summary Cards */}
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
                <Card>
                  <CardHeader>
                    <CardTitle>Template Usage Analytics</CardTitle>
                  </CardHeader>
                  <div className="flex gap-6 items-end justify-between p-6">
                    <div className="flex flex-col">

                      <DateInput
                        label="Start Date *"
                        value={startDateTemplate}
                        required
                        onChange={(val: string) => {
                          setStartDateTemplate(val);
                        }}
                      />

                    </div>

                    <div className="flex flex-col">
                      <DateInput
                        label="End Date *"
                        value={endDateTemplate}
                        required
                        onChange={(val: string) => {
                          setEndDateTemplate(val);
                        }}
                      />
                    </div>
                  </div>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={templateUsage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="template_name"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />

                        {/* Set bar color here */}
                        <Bar dataKey="usage_count" fill="#FF4D00" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                  <div className="flex justify-center pb-4">
                    <Button
                      onClick={handleClearDateTemplate}
                      disabled={loading}
                      className="px-10"
                    >
                      Clear Filter
                    </Button>
                  </div>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Activity Report</CardTitle>
                  </CardHeader>
                  {/* Filters Row */}
                  <div className="flex gap-6 items-end justify-between p-6">
                    <div className="flex flex-col">
                      
                      <DateInput
                        label="Start Date *"
                        value={startDate}
                        required
                        onChange={(val: string) => {
                          setStartDate(val);
                        }}
                      />
                    </div>

                    <div className="flex flex-col">
                    <DateInput
                        label="End Date *"
                        value={endDate}
                        required
                        onChange={(val: string) => {
                          setEndDate(val);
                        }}
                      />
                    </div>
                  </div>
                  {/* Chart */}
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityReport}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="team" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total_leads" fill="#6A5ACD" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>

                  {/* Button centered bottom */}
                  <div className="flex justify-center pb-4">
                    <Button
                      onClick={handleClearDate}
                      disabled={loading}
                      className="px-10"
                    >
                      Clear Filter
                    </Button>
                  </div>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-end justify-between">
                    <h1>Employee Activity Report</h1>
                    <Button onClick={handleDownloadCSV} disabled={loading}>
                      Download CSV
                    </Button>
                  </CardTitle>
                </CardHeader>
                <div className="flex gap-6 items-end justify-between p-4">
                  <div className="flex flex-col">
                    {/* <Label>Start Date</Label> */}
                    {/* <Input
                      type="date"
                      value={startDateEvent}
                      onChange={(e) => setStartDateEvent(e.target.value)}
                    /> */}
                    <DateInput
                        label="Start Date *"
                        value={startDateEvent}
                        required
                        onChange={(val: string) => {
                          setStartDateEvent(val);
                        }}
                      />
                  </div>

                  <div className="flex flex-col">
                    <Label>End Date</Label>
                    {/* <Input
                      type="date"
                      value={endDateEvent}
                      onChange={(e) => setEndDateEvent(e.target.value)}
                    /> */}
                    <DateInput
                        label="End Date *"
                        value={endDateEvent}
                        required
                        onChange={(val: string) => {
                          setEndDateEvent(val);
                        }}
                      />
                  </div>

                  <div className="flex flex-col">
                    <Label>Select Event</Label>
                    <select
                      className="border rounded p-2"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                    >
                      <option value="">-- Select Event --</option>
                      {events.map((ev) => (
                        <option key={ev.event_id} value={ev.event_id}>
                          {ev.event_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <Label>Search by Employee Name</Label>
                    <Input
                      placeholder="Enter employee name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-72 border-0 focus:ring-0 focus:outline-none focus:border-0"
                      style={{
                        boxShadow: "none",
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                  <Button onClick={handleClearDateforEvent} disabled={loading}>
                    Clear Filter
                  </Button>
                </div>
                </div>

                {filteredReport.length > 0 ? (
                  <table className="table-auto w-full mt-4 border">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border p-2">Employee ID</th>
                        <th className="border p-2">Employee Name</th>
                        <th className="border p-2">Event Name</th>
                        <th className="border p-2">Lead Date</th>
                        <th className="border p-2">Total Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReport.map((row, i) => (
                        <tr key={i}>
                          <td className="border p-2">{row.employee_id}</td>
                          <td className="border p-2">{row.user_name}</td>
                          <td className="border p-2">{row.event_name}</td>
                          <td className="border p-2">
                            {new Date(row.lead_date).toLocaleDateString()}
                          </td>
                          <td className="border p-2">{row.total_leads}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center mt-4">No records found</p>
                )}

                
              </Card>
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
                              Manager
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Team Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Members
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams?.map((team) => (
                            <tr
                              key={team.team_id}
                              className="border-b hover:bg-muted/20"
                            >
                              <td className="py-3 px-4">{team.team_id}</td>
                              <td className="py-3 px-4">{team.manager_name}</td>
                              <td className="py-3 px-4">{team.team_name}</td>
                              <td className="py-3 px-4">
                                {team.members.length}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  onClick={() => openTeamDialog(team)}
                                  variant="outline"
                                >
                                  Edit Team
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
          </Tabs>
        </main>
      </div>

      {/* Single Team Edit Modal */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTeamObj ? "Edit Team" : "Create a New Team"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Team Name */}
            <div>
              <Label htmlFor="team_name">Team Name *</Label>
              <Input
                id="team_name"
                placeholder="Enter team name"
                value={formData.team_name}
                onChange={handleChange}
              />
            </div>

            {/* Manager Selection */}
            <div>
              <Label>Manager *</Label>
              <Select
                value={formData.manager_id}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, manager_id: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem
                        key={user.employee_id}
                        value={String(user.employee_id)}
                      >
                        {user.user_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No users available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Employees Multi-Select */}
            <div>
              <Label>Employees *</Label>
              <Command className="border rounded-md">
                <CommandInput placeholder="Search employees..." />
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {users.map((user) => (
                    <CommandItem
                      key={user.employee_id}
                      onSelect={() => toggleEmployee(String(user.employee_id))}
                    >
                      <div
                        className={`flex items-center justify-between w-full ${formData.employees_id.includes(
                          String(user.employee_id)
                        )
                            ? "font-semibold text-primary"
                            : ""
                          }`}
                      >
                        <span>{user.user_name}</span>
                        {formData.employees_id.includes(
                          String(user.employee_id)
                        ) && <X className="w-4 h-4" />}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>

              {/* Selected Employees as Badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.employees_id.map((id) => {
                  const emp = users.find((u) => String(u.employee_id) === id);
                  return (
                    <Badge
                      key={id}
                      className="flex items-center space-x-1"
                      variant="secondary"
                    >
                      <span>{emp?.user_name || `User ${id}`}</span>
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => toggleEmployee(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdateTeam} disabled={loading}>
              {loading
                ? editTeamObj
                  ? "Updating..."
                  : "Creating..."
                : editTeamObj
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
