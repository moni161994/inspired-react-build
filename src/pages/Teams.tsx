import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
const formatDate = (isoStr: string | null | undefined) => {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Teams() {
  const { request, loading } = useApi<any>();
  const [leadData, setLeadData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters state
  const [eventNameFilter, setEventNameFilter] = useState("");
  const [leadNameFilter, setLeadNameFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Popup state
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const { toast } = useToast();

  // Fetch lead data
  const fetchLeadData = async () => {
    const res = await request(`/get_all_leads`, "GET");
    if (res && res.success === true && res.data) {
      setLeadData(res.data);
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

  // Delete lead handler (unchanged)
  const handleDelete = async (lead_id: any) => {
    try {
      const res = await request(`/delete_lead?lead_id=${lead_id}`, "DELETE");

      if (res && res.success === true) {
        setLeadData((prev: any[]) =>
          prev.filter((lead: any) => lead.lead_id !== lead_id)
        );

        const totalPages = Math.ceil((leadData.length - 1) / itemsPerPage);
        if (currentPage > totalPages) {
          setCurrentPage(totalPages);
        }

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
    } catch (err) {
      toast({
        variant: "destructive",
        title: "⚠️ Error",
        description: "Something went wrong while deleting. Please try again.",
      });
    }
  };

  // Filter & pagination logic with added filters
  const filteredLeads = leadData.filter((lead) => {
    // filter event name contains
    const matchesEvent = lead.event_name
      ?.toLowerCase()
      .includes(eventNameFilter.toLowerCase());
    // filter lead name contains
    const matchesName = lead.name
      ?.toLowerCase()
      .includes(leadNameFilter.toLowerCase());

    // filter start date & end date range - consider lead.created_at date
    const leadDate = new Date(lead.created_at);
    const afterStartDate =
      !startDateFilter || leadDate >= new Date(startDateFilter);
    const beforeEndDate = !endDateFilter || leadDate <= new Date(endDateFilter);

    return matchesEvent && matchesName && afterStartDate && beforeEndDate;
  });

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

  // Handlers for filters
  const handleEventNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventNameFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleLeadNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeadNameFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleStartDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDateFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleEndDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDateFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              epredia
            </h1>
            <p className="text-muted-foreground mb-4">Here is your Lead Data</p>
          </div>

          {/* Filters */}
          <Card className="mb-4">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Filter by Event Name</Label>
                  <Input
                    placeholder="Search event"
                    value={eventNameFilter}
                    onChange={handleEventNameFilterChange}
                  />
                </div>
                <div>
                  <Label>Filter by Lead Name</Label>
                  <Input
                    placeholder="Search lead"
                    value={leadNameFilter}
                    onChange={handleLeadNameFilterChange}
                  />
                </div>
                {/* <div>
                  <Label>Filter by Start Date</Label>
                  <Input
                    type="date"
                    value={startDateFilter}
                    onChange={handleStartDateFilterChange}
                  />
                </div>
                <div>
                  <Label>Filter by End Date</Label>
                  <Input
                    type="date"
                    value={endDateFilter}
                    onChange={handleEndDateFilterChange}
                  />
                </div> */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Company Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Designation
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Phone Number
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Event Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-6 text-center text-muted-foreground"
                        >
                          No leads found for the filter.
                        </td>
                      </tr>
                    )}
                    {paginatedLeads.map((lead: any) => (
                      <tr
                        key={lead?.lead_id}
                        className="border-b hover:bg-muted/20"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-foreground font-medium">
                              {lead?.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {lead?.company}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {lead?.designation || "-"}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {lead?.phone_numbers?.[0] || "-"}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {lead?.emails?.[0] || "-"}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {lead?.event_name || "Active Event"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2 items-center">
                            <Button
                              variant="link"
                              onClick={() => setSelectedLead(lead)}
                            >
                              View Lead Details
                            </Button>
                            <Button
                              onClick={() => handleDelete(lead?.lead_id)}
                              variant="link"
                              className="text-primary p-0 h-auto"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
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
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>

          {/* Lead Details Popup */}
          <Dialog
            open={selectedLead !== null}
            onOpenChange={() => setSelectedLead(null)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Lead Details</DialogTitle>
                <DialogDescription>
                  Details of lead: <strong>{selectedLead?.name}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <div>
                  <strong>Company:</strong> {selectedLead?.company || "-"}
                </div>
                <div>
                  <strong>Designation:</strong> {selectedLead?.designation || "-"}
                </div>
                <div>
                  <strong>Phone Numbers:</strong>{" "}
                  {selectedLead?.phone_numbers?.length
                    ? selectedLead.phone_numbers.join(", ")
                    : "-"}
                </div>
                <div>
                  <strong>Emails:</strong>{" "}
                  {selectedLead?.emails?.length
                    ? selectedLead.emails.join(", ")
                    : "-"}
                </div>
                <div>
                  <strong>Websites:</strong>{" "}
                  {selectedLead?.websites?.length
                    ? selectedLead.websites.join(", ")
                    : "-"}
                </div>
                <div>
                  <strong>Other Info:</strong>{" "}
                  {selectedLead?.other?.length
                    ? selectedLead.other.join(", ")
                    : "-"}
                </div>
                <div>
                  <strong>Created At:</strong> {formatDate(selectedLead?.created_at)}
                </div>
                <div>
                  <strong>Event Name:</strong> {selectedLead?.event_name || "-"}
                </div>
                <div>
                  <strong>QR Data:</strong> {selectedLead?.qr_data || "-"}
                </div>
                {selectedLead?.image_url && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={selectedLead.image_url}
                      alt={`Lead ${selectedLead.name}`}
                      className="max-h-48 rounded-md object-contain"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
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
