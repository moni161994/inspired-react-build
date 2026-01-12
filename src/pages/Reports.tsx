import { useEffect, useState, useMemo } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useApi } from "@/hooks/useApi";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TEMPLATE_DATA = [
  { id: 12, template_name: "UK_Template" },
  { id: 11, template_name: "India_Template" },
  { id: 10, template_name: "APAC_Template" },
  { id: 9, template_name: "EU_GDPR_Template" },
  { id: 8, template_name: "US_Template" },
];

export default function Reports() {
  const { request, loading, error } = useApi<any>();
  const [summary, setSummary] = useState<any>(null);
  const [allReports, setAllReports] = useState<any[]>([]); // Raw API data
  const [filter, setFilter] = useState<string>("all");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  // Access Control States - NEW
  const [myAccess, setMyAccess] = useState<any>(null);
  const [canDownloadReport, setCanDownloadReport] = useState(false);
  const [canFilterReports, setCanFilterReports] = useState(false);

  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };
  useEffect(() => {
    loadMyAccess();
    const fetchUsers = async () => {
      try {
        const currentUserId = getCurrentUserId();
        const response = await fetch("https://api.inditechit.com/get_users");
        const result = await response.json();

        if (result.status_code === 200 && Array.isArray(result.data)) {
          let list: any = result.data;
          if (currentUserId !== 1015) {
            list = list.filter((u) => (u.parent_id === currentUserId || u.employee_id == currentUserId));
          }
          setUsers(list);
          // setUsers(result.data);
        }
      } catch (err) {
        console.error("Users fetch error:", err);
      }
    };
    fetchUsers();
  }, []);

  // NEW FUNCTION - Reports access load करने के लिए
  const loadMyAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const res = await request(`/get_single_access/${userId}`, "GET");
      if (res?.status_code === 200 && res.data) {
        const parsed: any = {
          page: JSON.parse(res.data.page),
          point: JSON.parse(res.data.point),
          user_id: Number(res.data.user_id),
        };
        setMyAccess(parsed);

        const hasPage = (p: string) => parsed.page.includes(p);
        const hasAction = (page: string, action: string) => {
          const pageName = page.replace("/", "").replace(/\/+$/, "") || "report";
          const suffix = `${action}_${pageName}`;
          return parsed.point.includes(suffix);
        };

        // Report Page Permissions
        setCanDownloadReport(hasPage("/report") && hasAction("/report", "download_report"));
        setCanFilterReports(hasPage("/report") && hasAction("/report", "filter"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
      setCanDownloadReport(false);
      setCanFilterReports(false);
    }
  };


  // Fetch raw data from API (only template filter goes to server)
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (templateId !== "all") params.set("template_id", templateId);
    const qs = params.toString();
    return qs ? `/consent_report?${qs}` : "/consent_report";
  };

  useEffect(() => {
    const fetchReports = async () => {
      const endpoint = buildQuery();
      let data: any = await request(endpoint, "GET");
      let newData
      const currentUserId = getCurrentUserId();
      if (data?.summary) setSummary(data.summary);
      if (data?.data) {
        if (currentUserId !== 1015) {
          newData = data.data.filter((lead: any) => lead.captured_by === currentUserId);
        }else{
          newData = data.data;
        }        
        setAllReports(newData); // Store raw data for client-side filtering
      } else {
        setAllReports([]);
      }
    };

    fetchReports();
  }, [request, templateId]); // Only templateId affects server call

  // ✅ CLIENT-SIDE FILTERING - ALL FILTERS WORK ON LOCAL DATA
  const filteredReports = useMemo(() => {
    return allReports.filter((item) => {
      // Consent status filter
      if (filter !== "all" && item.consent_status !== filter) {
        return false;
      }

      // Name filter
      if (
        nameFilter &&
        !item.name?.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      // Event filter
      if (
        eventFilter &&
        !item.event_name?.toLowerCase().includes(eventFilter.toLowerCase())
      ) {
        return false;
      }

      // ✅ CAPTURED BY FILTER - Works on captured_by field (number)
      if (selectedUserId && item.captured_by !== selectedUserId) {
        return false;
      }

      return true;
    });
  }, [allReports, filter, nameFilter, eventFilter, selectedUserId]);

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
  };

  const handleResetToAllUsers = () => {
    setSelectedUserId(null);
  };

  const handleDownloadCSV = () => {
    if (!filteredReports || filteredReports.length === 0) return;

    const headers = [
      "Lead ID",
      "Name",
      "Event Name",
      "Email",
      "Consent",
      "Consent Status",
      "City",
      "State",
      "Country",
      "Captured By",
    ];

    const rows = filteredReports.map((item: any) => [
      item.lead_id,
      item.name,
      item.event_name,
      item.emails,
      item.consent ?? "",
      item.consent_status,
      item.city ?? "",
      item.state ?? "",
      item.country ?? "",
      users.find(u => u.employee_id === item.captured_by)?.user_name || item.captured_by || "—",
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consent_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get selected user name for display
  const selectedUserName = users.find(u => u.employee_id === selectedUserId)?.user_name;

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          </div>

          {loading && <p className="text-center py-8 text-muted-foreground">Loading reports...</p>}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="shadow">
                <CardHeader className="pb-2">
                  <CardTitle>Total Leads</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold">
                  {summary.total_leads}
                </CardContent>
              </Card>

              <Card className="shadow">
                <CardHeader className="pb-2">
                  <CardTitle>Consent Granted</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-green-600">
                  {summary.granted}
                </CardContent>
              </Card>

              <Card className="shadow">
                <CardHeader className="pb-2">
                  <CardTitle>Consent Denied</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-red-600">
                  {summary.denied}
                </CardContent>
              </Card>

              <Card className="shadow">
                <CardHeader className="pb-2">
                  <CardTitle>Missing Consent</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-yellow-600">
                  {summary.missing}
                </CardContent>
              </Card>

              <Card className="shadow">
                <CardHeader className="pb-2">
                  <CardTitle>Consent Rate</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-blue-600">
                  {summary.consent_rate}%
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="shadow">
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <CardTitle>Leads Report</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCSV}
                    disabled={filteredReports.length === 0 || !canDownloadReport}  // ✅ Permission check
                  >
                    {canDownloadReport ? "Download CSV" : "No Access"}
                  </Button>

                </div>
              </div>

              {/* Filters - All in single responsive row */}
              {canFilterReports && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Name Filter */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Filter by Name
                      </label>
                      <Input
                        placeholder="Enter name..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="h-9 text-sm border-gray focus:border-gray" 
                      />
                    </div>

                    {/* Event Name Filter */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Filter by Event
                      </label>
                      <Input
                        placeholder="Enter event name..."
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                        className="h-9 text-sm border-gray focus:border-gray"
                      />
                    </div>

                    {/* Consent Status Filter */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Consent Status
                      </label>
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="h-9 border-gray focus:border-gray">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="granted">Granted</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                          <SelectItem value="missing">Missing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Captured By Filter - ✅ FULLY WORKING CLIENT-SIDE */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Captured By
                      </label>
                      <Select
                        value={selectedUserId?.toString() || "all-users"}
                        onValueChange={(value) => {
                          if (value === "all-users") {
                            handleResetToAllUsers();
                          } else {
                            handleUserSelect(Number(value));
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 border-gray focus:border-gray" >
                          <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-users">All Users</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.employee_id} value={user.employee_id.toString()}>
                              {user.user_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template Filter */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Template
                      </label>
                      <Select value={templateId} onValueChange={setTemplateId}>
                        <SelectTrigger className="h-9 border-gray focus:border-gray">
                          <SelectValue placeholder="All Templates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Templates</SelectItem>
                          {TEMPLATE_DATA.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.template_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNameFilter("");
                        setEventFilter("");
                        setFilter("all");
                        setTemplateId("all");
                        handleResetToAllUsers();
                      }}
                      className="w-full sm:w-auto"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </>
              )}
            </CardHeader>

            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {filteredReports.length} of {allReports.length} leads
                {nameFilter && <span className="ml-2">• Name: "{nameFilter}"</span>}
                {eventFilter && <span className="ml-2">• Event: "{eventFilter}"</span>}
                {filter !== "all" && <span className="ml-2">• Status: {filter}</span>}
                {templateId !== "all" && (
                  <span className="ml-2">
                    • Template: {TEMPLATE_DATA.find(t => t.id.toString() === templateId)?.template_name}
                  </span>
                )}
                {selectedUserId && selectedUserName && (
                  <span className="ml-2">• Captured By: "{selectedUserName}"</span>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Captured By</TableHead>
                    <TableHead>Consent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredReports.map((item: any) => (
                    <TableRow key={item.lead_id}>
                      <TableCell>{item.lead_id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.event_name}</TableCell>
                      <TableCell>{item.emails}</TableCell>
                      <TableCell>{item.city}</TableCell>
                      <TableCell>{item.state}</TableCell>
                      <TableCell>{item.country}</TableCell>
                      <TableCell>
                        {users.find(u => u.employee_id === item.captured_by)?.user_name || item.captured_by || "—"}
                      </TableCell>
                      <TableCell>{item.consent === 1 ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {item.consent_status === "granted" && (
                          <Badge className="bg-green-600">Granted</Badge>
                        )}
                        {item.consent_status === "denied" && (
                          <Badge className="bg-red-600">Denied</Badge>
                        )}
                        {item.consent_status === "missing" && (
                          <Badge className="bg-yellow-600 text-black">Missing</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredReports.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No leads found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {nameFilter || eventFilter || filter !== "all" || templateId !== "all" || selectedUserId
                      ? "Try adjusting your search or filter criteria."
                      : "No leads available."
                    }
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNameFilter("");
                      setEventFilter("");
                      setFilter("all");
                      setTemplateId("all");
                      handleResetToAllUsers();
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
