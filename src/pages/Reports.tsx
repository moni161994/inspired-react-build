import { useEffect, useState } from "react";
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

export default function Reports() {
  const { request, loading, error } = useApi<any>();
  const [summary, setSummary] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchReports = async () => {
      const data: any = await request("/consent_report", "GET");

      if (data?.summary) setSummary(data.summary);
      if (data?.data) setReports(data.data);
      else setReports([]);
    };

    fetchReports();
  }, []);

  // Filter reports based on consent status
  const filteredReports = reports.filter((item) => {
    if (filter === "all") return true;
    if (filter === "granted") return item.consent_status === "granted";
    if (filter === "denied") return item.consent_status === "denied";
    if (filter === "missing") return item.consent_status === "missing";
    return true;
  });

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

          {/* ---------- TABLE OF LEADS WITH FILTER ---------- */}
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leads Report</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                disabled={filteredReports.length === 0}
              >
                Download CSV
              </Button>
            </CardHeader>

            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                Showing {filteredReports.length} of {reports.length} leads
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
                          // <Badge className="bg-yellow-600 text-black">
                          //   Missing
                          // </Badge>
                          <button className="flex items-center gap-2">
                            <span className="text-green-600">✔</span>
                          </button>

                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredReports.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No leads match the selected filter
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
