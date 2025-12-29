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
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

export default function Teams() {
  const { request, loading } = useApi<any>();
  const [leadData, setLeadData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>("");
  const [eventNameFilter, setEventNameFilter] = useState<string>("");
  const [leadNameFilter, setLeadNameFilter] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const { toast } = useToast();

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://api.inditechit.com/get_users");
        const result = await response.json();
        if (result.status_code === 200 && Array.isArray(result.data)) {
          setUsers(result.data);
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
    const matchesUser = !selectedUserId || lead.captured_by_id === selectedUserId;

    console.log(lead.captured_by_id);
    

    return matchesEvent && matchesName && matchesType && matchesUser;
  });

  const fetchLeadData = async () => {
    const currentUserId = getCurrentUserId();
    const res = await request(`/get_all_leads`, "GET");
    if (res && res.success === true && res.data) {
      let data: any[] = res.data;
      if (currentUserId !== 1015) {
        data = data.filter((lead: any) => lead.captured_by_id === currentUserId);
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
    fetchLeadData();
  }, []);

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setCurrentPage(1);
  };

  const handleResetToAllUsers = () => {
    setSelectedUserId(null);
    setCurrentPage(1);
  };

  const handleDelete = async (lead_id: any) => {
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
                              <Button variant="link" size="sm" onClick={() => handleDelete(lead?.lead_id)}>
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
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle>Lead Details - {selectedLead?.name}</DialogTitle>
              </DialogHeader>
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {selectedLead?.company && <div><strong>Company:</strong> {selectedLead.company}</div>}
                    {selectedLead?.designation && <div><strong>Designation:</strong> {selectedLead.designation}</div>}
                    {selectedLead?.phone_numbers?.length > 0 && (
                      <div><strong>Phone:</strong> {selectedLead.phone_numbers.join(", ")}</div>
                    )}
                    {selectedLead?.emails?.length > 0 && (
                      <div><strong>Email:</strong> {selectedLead.emails.join(", ")}</div>
                    )}
                    {selectedLead?.created_at && (
                      <div><strong>Created:</strong> {formatDate(selectedLead.created_at)}</div>
                    )}
                    {selectedLead?.event_name && (
                      <div><strong>Event:</strong> {selectedLead.event_name}</div>
                    )}
                    {selectedLead?.captured_by_name && (
                      <div><strong>Captured By:</strong> {selectedLead.captured_by_name}</div>
                    )}
                  </div>
                  {selectedLead?.image_url && (
                    <div>
                      <a href={selectedLead.image_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={selectedLead.image_url}
                          alt="Lead image"
                          className="w-full max-w-md h-64 object-contain rounded border"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="p-6 pt-0 border-t">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
