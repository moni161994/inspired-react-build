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

export default function Reports() {
  const { request, loading, error } = useApi<any>();
  const [summary, setSummary] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");

  useEffect(() => {
    const fetchReports = async () => {
      const data: any = await request("/consent_report", "GET");

      if (data?.summary) setSummary(data.summary);
      if (data?.data) setReports(data.data);
      else setReports([]);
    };

    fetchReports();
  }, []);

  // Filter reports based on all criteria
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      // Consent status filter
      if (filter !== "all" && item.consent_status !== filter) {
        return false;
      }

      // Name filter (case-insensitive)
      if (nameFilter && !item.name?.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }

      // Event name filter (case-insensitive)
      if (eventFilter && !item.event_name?.toLowerCase().includes(eventFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [reports, filter, nameFilter, eventFilter]);

  const handleDownloadCSV = () => {
    if (!filteredReports || filteredReports.length === 0) return;

    const headers = [
      "Lead ID",
      "Name",
      "Event Name",
      "Email",
      "Consent",
      "Consent Status",
    ];

    const rows = filteredReports.map((item: any) => [
      item.lead_id,
      item.name,
      item.event_name,
      item.emails,
      item.consent ?? "",
      item.consent_status,
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

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* ---------- PAGE HEADER ---------- */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          </div>

          {loading && <p>Loading reports...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {/* ---------- SUMMARY CARDS ---------- */}
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

          {/* ---------- TABLE OF LEADS WITH ENHANCED FILTERS ---------- */}
          <Card className="shadow">
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <CardTitle>Leads Report</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCSV}
                    disabled={filteredReports.length === 0}
                    className="border border-border"
                  >
                    Download CSV
                  </Button>
                </div>
              </div>

              {/* Enhanced Filter Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Name Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Filter by Name
                  </label>
                  <Input
                    placeholder="Enter name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="border border-gray-300 rounded"
                  />
                </div>

                {/* Event Name Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Filter by Event
                  </label>
                  <Input
                    placeholder="Enter event name..."
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="border border-gray-300 rounded"
                  />
                </div>

                {/* Consent Status Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Consent Status
                  </label>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="border border-gray-300 rounded">
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

                {/* Spacer or Clear Filters Button */}
                <div className="flex items-end space-x-2">
                  <Button
                    // variant="outline"
                    size="sm"
                    onClick={() => {
                      setNameFilter("");
                      setEventFilter("");
                      setFilter("all");
                    }}
                    className="border border-input"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {filteredReports.length} of {reports.length} leads
                {nameFilter && (
                  <span className="ml-2">
                    • Name: "{nameFilter}"
                  </span>
                )}
                {eventFilter && (
                  <span className="ml-2">
                    • Event: "{eventFilter}"
                  </span>
                )}
                {filter !== "all" && (
                  <span className="ml-2">
                    • Status: {filter}
                  </span>
                )}
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Email</TableHead>
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
                      <TableCell>{item.consent ?? "—"}</TableCell>
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
              {filteredReports.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No leads match the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
