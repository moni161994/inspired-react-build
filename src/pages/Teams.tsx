import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

// 🔹 ACCESS CONTROL TYPES
interface AccessPointData {
  page: string[];
  point: string[];
  user_id: number;
}

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col sm:flex-row sm:gap-2 text-sm break-words">
    <strong className="min-w-[100px] text-muted-foreground font-medium shrink-0">{label}:</strong>
    <span className="text-foreground">{value}</span>
  </div>
);

export default function Teams() {
  const { request, loading } = useApi<any>();
  const { toast } = useToast();

  // 🔹 ALL STATES INSIDE COMPONENT
  const [leadData, setLeadData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>("");
  const [eventNameFilter, setEventNameFilter] = useState<string>("");
  const [leadNameFilter, setLeadNameFilter] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // 🔹 ACCESS CONTROL STATES
  const [myAccess, setMyAccess] = useState<AccessPointData | null>(null);
  const [canViewLeads, setCanViewLeads] = useState(false);
  const [canDeleteLead, setCanDeleteLead] = useState(false);
  const [canFilterLeads, setCanFilterLeads] = useState(false);
  const [canDownloadReports, setCanDownloadReports] = useState(false);

  // Helper to format ISO date to locale string
  const formatDate = (isoStr: string | null | undefined): string => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // CSV conversion function
  const convertLeadsToCSV = (leads: any[]): string => {
    const headers = [
      "Name", "Company", "Designation", "Phone Number", "Email", "Lead Type",
      "Event Name", "Created At", "City", "State", "ZIP", "Country",
      "Area of Interest", "Disclaimer"
    ];

    const getLeadType = (lead: any): string => {
      if (!lead.image_url) return "Manual Lead";
      if (lead.image_url && (!lead.emails || lead.emails.length === 0)) return "Badge";
      if (lead.image_url && lead.emails && lead.emails.length > 0) return "Visiting Card";
      return "Manual Lead";
    };

    const rows = leads.map((lead) => [
      lead.name || "",
      lead.company || "",
      lead.designation || "",
      (lead.phone_numbers && lead.phone_numbers[0]) || "",
      (lead.emails && lead.emails[0]) || "",
      getLeadType(lead),
      lead.event_name || "",
      lead.created_at ? formatDate(lead.created_at) : "",
      lead.city || "",
      lead.state || "",
      lead.zip || "",
      lead.country || "",
      lead.area_of_interest || "",
      lead.disclaimer || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };

  // 🔹 LOAD USER ACCESS FOR LEADS PAGE
  const loadMyAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setCanViewLeads(false);
      return;
    }

    try {
      const res: any = await request(`/get_single_access/${userId}`, "GET");
      if (res?.status_code === 200 && res.data) {
        const parsed: AccessPointData = {
          page: JSON.parse(res.data.page),
          point: JSON.parse(res.data.point),
          user_id: Number(res.data.user_id),
        };
        setMyAccess(parsed);

        const hasPage = (p: string) => parsed.page.includes(p);
        const hasAction = (page: string, action: string) => {
          const pageName = page.replace("/", "").replace(/\/+$/, "") || "dashboard";
          const suffix = `${action}_${pageName}`;
          return parsed.point.includes(suffix);
        };

        // 👈 LEAD-SPECIFIC PERMISSIONS
        setCanViewLeads(hasPage("/lead") && hasAction("/lead", "view_leads"));
        setCanDeleteLead(hasPage("/lead") && hasAction("/lead", "delete_lead"));
        setCanFilterLeads(hasPage("/lead") && hasAction("/lead", "filter"));
        setCanDownloadReports(hasPage("/lead") && hasAction("/lead", "download_reports"));
      } else {
        setCanViewLeads(false);
        setCanDeleteLead(false);
        setCanFilterLeads(false);
        setCanDownloadReports(false);
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
      setCanViewLeads(false);
      setCanDeleteLead(false);
      setCanFilterLeads(false);
      setCanDownloadReports(false);
    }
  };

  // 🔹 LOAD ACCESS ON MOUNT
  useEffect(() => {
    loadMyAccess();
  }, []);

  // Fetch users
  useEffect(() => {
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

  function getLeadType(lead: any): string {
    if (!lead.image_url) return "manual_lead";
    if (lead.image_url && (!lead.emails || lead.emails.length === 0)) return "badge";
    if (lead.image_url && lead.emails && lead.emails.length > 0) return "visiting_card";
    return "manual_lead";
  }

  const filteredLeads = leadData.filter((lead: any) => {
    const eventName = (lead.event_name || "").toLowerCase();
    const leadName = (lead.name || "").toLowerCase();

    const filterEvent = eventNameFilter.toLowerCase();
    const filterName = leadNameFilter.toLowerCase();

    const matchesEvent = eventName.includes(filterEvent);
    const matchesName = leadName.includes(filterName);
    const matchesType = !leadTypeFilter || getLeadType(lead) === leadTypeFilter;

    const leadCapturedId = Number(lead.captured_by);
    const matchesUser = !selectedUserId || leadCapturedId === selectedUserId;

    return matchesEvent && matchesName && matchesType && matchesUser;
  });

  const fetchLeadData = async () => {
    const currentUserId = getCurrentUserId();
    console.log(currentUserId);

    const res = await request(`/get_all_leads`, "GET");
    if (res && res.success === true && res.data) {
      let data: any[] = res.data;
      if (currentUserId !== 1015) {
        data = data.filter((lead: any) => lead.captured_by === currentUserId);
      }
      setLeadData(data);
    } else {
      toast({
        variant: "destructive",
        title: "❌ Failed to Fetch Data",
        description: res?.msg || "Unable to load leads at the moment.",
      });
    }
  };

  useEffect(() => {
    if (canViewLeads) {
      fetchLeadData();
    }
  }, [canViewLeads]);

  const handleUserSelect = (userId: number) => {
    if (canFilterLeads) {
      setSelectedUserId(userId);
      setCurrentPage(1);
    }
  };

  const handleResetToAllUsers = () => {
    if (canFilterLeads) {
      setSelectedUserId(null);
      setCurrentPage(1);
    }
  };

  const handleDelete = async (lead_id: any) => {
    if (!canDeleteLead) {
      toast({
        variant: "destructive",
        title: "❌ No Permission",
        description: "You don't have permission to delete leads.",
      });
      return;
    }

    try {
      const res = await request(`/delete_lead?lead_id=${lead_id}`, "DELETE");
      if (res && res.success === true) {
        setLeadData((prev: any[]) => prev.filter((lead: any) => lead.lead_id !== lead_id));
        toast({
          title: "🗑️ Lead Deleted",
          description: "The lead has been removed successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Failed to Delete",
          description: res?.msg || "Something went wrong while deleting the lead.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "⚠️ Error",
        description: "Something went wrong while deleting. Please try again.",
      });
    }
  };

  const handleDownloadCSV = () => {
    if (!canDownloadReports) {
      toast({
        variant: "destructive",
        title: "❌ No Permission",
        description: "You don't have permission to download reports.",
      });
      return;
    }

    if (filteredLeads.length === 0) {
      toast({
        variant: "destructive",
        title: "❌ No Data",
        description: "No leads available to download with current filters.",
      });
      return;
    }
    const csvContent = convertLeadsToCSV(filteredLeads);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // 🔹 ACCESS DENIED SCREEN
  if (!canViewLeads) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-semibold mb-4">
                  {myAccess ? "Access Denied" : "Loading Permissions..."}
                </h1>
                <p>
                  {myAccess
                    ? "You don't have permission to view Leads."
                    : "Please wait while checking your permissions."
                  }
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">All Lead Capture</h1>
            <p className="text-muted-foreground mb-4">Here is your Lead Data</p>
          </div>

          {/* 🔹 FILTERS - HIDE IF NO FILTER PERMISSION */}
          {canFilterLeads && (
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>Filter by Event Name</Label>
                    <Input
                      placeholder="Search event"
                      value={eventNameFilter}
                      onChange={(e) => {
                        setEventNameFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Filter by Lead Name</Label>
                    <Input
                      placeholder="Search lead"
                      value={leadNameFilter}
                      onChange={(e) => {
                        setLeadNameFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Captured By</Label>
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
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select User" />
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
                  <div>
                    <Label>Lead Type</Label>
                    <select
                      value={leadTypeFilter}
                      onChange={(e) => {
                        setLeadTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border rounded px-3 py-2 mt-1"
                    >
                      <option value="">All Types</option>
                      <option value="badge">Badge</option>
                      <option value="visiting_card">Visiting Card</option>
                      <option value="manual_lead">Manual Lead</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleDownloadCSV} disabled={loading}>
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Designation</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Signature</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Captured By</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Event</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-muted-foreground">
                          {leadData.length === 0 ? "No leads found." : "No leads match your filters."}
                        </td>
                      </tr>
                    ) : (
                      paginatedLeads.map((lead: any) => (
                        <tr key={lead?.lead_id} className="border-b hover:bg-muted/20">
                          <td className="py-3 px-4 font-medium">{lead?.name || "-"}</td>
                          <td className="py-3 px-4">{lead?.company || "-"}</td>
                          <td className="py-3 px-4">{lead?.designation || "-"}</td>
                          <td className="py-3 px-4">{lead?.phone_numbers?.[0] || "-"}</td>
                          <td className="py-3 px-4">{lead?.emails?.[0] || "-"}</td>
                          <td className="py-3 px-4">
                            {lead?.signature && (
                              <img
                                src={`data:image/png;base64,${lead.signature}`}
                                alt="signature"
                                style={{ height: "60px", width: "80px", objectFit: "cover" }}
                              />
                            )}
                          </td>
                          <td className="py-3 px-4">{lead?.captured_by_name || "Active Event"}</td>
                          <td className="py-3 px-4">{lead?.event_name || "Active Event"}</td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="link" size="sm" onClick={() => setSelectedLead(lead)}>
                                View
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleDelete(lead?.lead_id)}
                                disabled={!canDeleteLead}
                                title={!canDeleteLead ? "No delete permission" : "Delete lead"}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
              >
                Previous
              </Button>
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    onClick={() => goToPage(pageNum)}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                size="sm"
              >
                Next
              </Button>
            </div>
          )}

          <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
              {/* Fixed Header */}
              <DialogHeader className="p-6 pb-4 border-b bg-background z-10">
                <DialogTitle className="text-xl">
                  Lead Details {selectedLead?.name ? `- ${selectedLead.name}` : ""}
                </DialogTitle>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  {/* --- LEFT COLUMN (Text Details) spans 2 columns --- */}
                  <div className="lg:col-span-2 space-y-6">

                    {/* Section 1: Contact Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2 text-foreground/80">Contact Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {selectedLead?.lead_id && <InfoRow label="Lead ID" value={selectedLead.lead_id} />}
                        {selectedLead?.company && <InfoRow label="Company" value={selectedLead.company} />}
                        {selectedLead?.designation && <InfoRow label="Designation" value={selectedLead.designation} />}
                        {selectedLead?.phone_numbers?.length > 0 && (
                          <InfoRow label="Phone" value={selectedLead.phone_numbers.join(", ")} />
                        )}
                        {selectedLead?.emails?.length > 0 && (
                          <InfoRow label="Email" value={selectedLead.emails.join(", ")} />
                        )}
                        {selectedLead?.websites?.length > 0 && (
                          <InfoRow label="Website" value={selectedLead.websites.join(", ")} />
                        )}
                        {selectedLead?.other?.length > 0 && (
                          <InfoRow label="Other Info" value={selectedLead.other.join(", ")} />
                        )}
                      </div>
                    </div>

                    {/* Section 2: Location */}
                    {(selectedLead?.city || selectedLead?.state || selectedLead?.country || selectedLead?.zip) && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg border-b pb-2 text-foreground/80">Location</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {selectedLead?.city && <InfoRow label="City" value={selectedLead.city} />}
                          {selectedLead?.state && <InfoRow label="State" value={selectedLead.state} />}
                          {selectedLead?.zip && <InfoRow label="ZIP" value={selectedLead.zip} />}
                          {selectedLead?.country && <InfoRow label="Country" value={selectedLead.country} />}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Event & Meta Data */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2 text-foreground/80">Event & Consent</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {selectedLead?.event_name && <InfoRow label="Event Name" value={selectedLead.event_name} />}
                        {selectedLead?.created_at && <InfoRow label="Captured At" value={formatDate(selectedLead.created_at)} />}
                        {selectedLead?.captured_by_name && <InfoRow label="Captured By" value={selectedLead.captured_by_name} />}
                        {selectedLead?.area_of_interest && <InfoRow label="Interest" value={selectedLead.area_of_interest} />}

                        <div className="sm:col-span-2 flex gap-6 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Email Opt-in:</span>
                            <Badge variant={selectedLead?.email_opt_in ? "default" : "secondary"}>
                              {selectedLead?.email_opt_in ? "Yes" : "No"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Consent:</span>
                            <Badge variant={selectedLead?.consent ? "default" : "destructive"}>
                              {selectedLead?.consent ? "Granted" : "Missing"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Long Text (Disclaimer/QR) */}
                    {(selectedLead?.disclaimer || selectedLead?.qr_data) && (
                      <div className="space-y-3 pt-2">
                        {selectedLead?.disclaimer && (
                          <div className="bg-muted/30 p-3 rounded-md border text-sm">
                            <span className="font-semibold block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Disclaimer</span>
                            {selectedLead.disclaimer}
                          </div>
                        )}
                        {selectedLead?.qr_data && (
                          <div className="bg-slate-50 p-3 rounded-md border text-xs font-mono break-all">
                            <span className="font-semibold block mb-1 uppercase tracking-wider text-muted-foreground">Raw QR Data</span>
                            {selectedLead.qr_data}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* --- RIGHT COLUMN (Visuals) spans 1 column --- */}
                  <div className="space-y-6">
                    {selectedLead?.image_url ? (
                      <div className="border rounded-lg p-3 bg-muted/10 flex flex-col items-center">
                        <span className="text-sm font-medium text-muted-foreground mb-2 self-start">Captured Image</span>
                        <a href={selectedLead.image_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                          <img
                            src={selectedLead.image_url}
                            alt="Lead Capture"
                            className="w-full h-64 object-contain rounded bg-white border shadow-sm hover:opacity-95 transition-opacity cursor-zoom-in"
                          />
                        </a>
                        <span className="text-xs text-muted-foreground mt-2">Click to enlarge</span>
                      </div>
                    ) : (
                      <div className="border rounded-lg h-64 flex items-center justify-center bg-muted/10 text-muted-foreground text-sm">
                        No Image Captured
                      </div>
                    )}

                    {selectedLead?.signature_binary ? (
                      <div className="border rounded-lg p-3 bg-muted/10">
                        <span className="text-sm font-medium text-muted-foreground mb-2 block">Signature</span>
                        <div className="bg-white border rounded p-2 flex items-center justify-center h-24">
                          {/* <img
                  src={`data:image/png;base64,${selectedLead.signature_binary}`}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain"
                /> */}
                          <img

                            src={`data:image/png;base64,${selectedLead.signature}`}

                            alt="Signature"

                            className="w-full h-full object-contain p-2"

                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <DialogFooter className="p-4 border-t bg-muted/5 mt-auto">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div >
  );
}
