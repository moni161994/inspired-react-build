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

export default function Reports() {
  const { request, loading, error } = useApi<any>();
  const [summary, setSummary] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const data: any = await request("/consent_report", "GET");

      if (data?.summary) setSummary(data.summary);
      if (data?.data) setReports(data.data);
      else setReports([]);
    };

    fetchReports();
  }, []);

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

          {/* ---------- TABLE OF LEADS ---------- */}
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Leads Report</CardTitle>
            </CardHeader>

            <CardContent>
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
                  {reports.map((item: any) => (
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
                          <Badge className="bg-yellow-600 text-black">
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}
