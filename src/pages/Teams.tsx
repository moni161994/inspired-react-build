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

// Updated CSV conversion function
const convertLeadsToCSV = (leads: any[]) => {
  const headers = [
    "Name",
    "Company",
    "Designation",
    "Phone Number",
    "Email",
    "Lead Type",
    "Event Name",
    "Created At",
    "City",
    "State",
    "ZIP",
    "Country",
    "Area of Interest",
    "Disclaimer",
  ];

  function getLeadType(lead: any) {
    if (!lead.image_url) {
      return "Manual Lead";
    }
    if (lead.image_url && (!lead.emails || lead.emails.length === 0)) {
      return "Badge";
    }
    if (lead.image_url && lead.emails && lead.emails.length > 0) {
      return "Visiting Card";
    }
    return "Manual Lead";
  }

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
      row
        .map((item) => `"${String(item).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  return csvContent;
};

export default function Teams() {
  const { request, loading } = useApi<any>();
  const [leadData, setLeadData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [leadTypeFilter, setLeadTypeFilter] = useState("");

  // Filters state
  const [eventNameFilter, setEventNameFilter] = useState("");
  const [leadNameFilter, setLeadNameFilter] = useState("");
  const [capturedByFilter, setCapturedByFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Popup state
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const { toast } = useToast();

  function getLeadType(lead: any) {
    if (!lead.image_url) {
      return "manual_lead";
    }
    if (lead.image_url && (!lead.emails || lead.emails.length === 0)) {
      return "badge";
    }
    if (lead.image_url && lead.emails && lead.emails.length > 0) {
      return "visiting_card";
    }
    return "manual_lead";
  }

  const filteredLeads = leadData.filter((lead) => {
    const eventName = (lead.event_name || "").toLowerCase();
    const leadName = (lead.name || "").toLowerCase();
    const capturedByName = (lead.captured_by_name || "Active Event").toLowerCase();

    const filterEvent = eventNameFilter.toLowerCase();
    const filterName = leadNameFilter.toLowerCase();
    const filterCapturedBy = capturedByFilter.toLowerCase();

    const matchesEvent = eventName.includes(filterEvent);
    const matchesName = leadName.includes(filterName);
    const matchesCapturedBy =
      !capturedByFilter || capturedByName.includes(filterCapturedBy);
    const matchesType = !leadTypeFilter || getLeadType(lead) === leadTypeFilter;

    const leadDate = lead.created_at ? new Date(lead.created_at) : null;
    const startDate = startDateFilter ? new Date(startDateFilter) : null;
    const endDate = endDateFilter ? new Date(endDateFilter) : null;

    const afterStartDate = !startDate || (leadDate && leadDate >= startDate);
    const beforeEndDate = !endDate || (leadDate && leadDate <= endDate);

    return (
      matchesEvent &&
      matchesName &&
      matchesCapturedBy &&
      matchesType &&
      afterStartDate &&
      beforeEndDate
    );
  });

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

  // Delete lead handler
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
          description:
            res?.msg || "Something went wrong while deleting the lead.",
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

  // CSV Download Handler
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
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `leads_export_${new Date().toISOString()}.csv`
    );
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

  // Handlers for filters
  const handleEventNameFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEventNameFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleLeadNameFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLeadNameFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleCapturedByFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCapturedByFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleStartDateFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStartDateFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleEndDateFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
              All Lead Capture
            </h1>
            <p className="text-muted-foreground mb-4">
              Here is your Lead Data
            </p>
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
                    className="border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <Label>Filter by Lead Name</Label>
                  <Input
                    placeholder="Search lead"
                    value={leadNameFilter}
                    onChange={handleLeadNameFilterChange}
                    className="border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <Label>Filter by Captured By</Label>
                  <Input
                    placeholder="Search captured by"
                    value={capturedByFilter}
                    onChange={handleCapturedByFilterChange}
                    className="border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <Label>Filter by Lead Type</Label>
                  <select
                    value={leadTypeFilter}
                    onChange={(e) => {
                      setLeadTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border rounded px-2 py-2 mt-1 text-foreground bg-background"
                  >
                    <option value="">All Types</option>
                    <option value="badge">Badge</option>
                    <option value="visiting_card">Visiting Card</option>
                    <option value="manual_lead">Manual Lead</option>
                  </select>
                </div>
              </div>

              {/* Optional date filters if you want inputs visible */}
              {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDateFilter}
                    onChange={handleStartDateFilterChange}
                    className="border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDateFilter}
                    onChange={handleEndDateFilterChange}
                    className="border border-gray-300 rounded"
                  />
                </div>
              </div> */}

              {/* Download CSV Button */}
              <div className="mt-4 flex justify-end">
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
                        Signature
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Captured By
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
                          colSpan={9}
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
                          {lead?.signature && (
                            <img
                              src={`data:image/png;base64,${lead?.signature}`}
                              alt="signature"
                              style={{
                                height: "80px",
                                width: "100px",
                                objectFit: "cover",
                              }}
                            />
                          )}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {lead?.captured_by_name || "Active Event"}
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
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col justify-center item-center">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle>Lead Details</DialogTitle>
                <DialogDescription>
                  Details of lead: <strong>{selectedLead?.name}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Left: Text fields */}
                  <div className="space-y-3 pr-4 max-h-[calc(90vh-200px)] overflow-y-auto">
                    {selectedLead?.company && (
                      <div>
                        <strong>Company:</strong> {selectedLead.company}
                      </div>
                    )}
                    {selectedLead?.designation && (
                      <div>
                        <strong>Designation:</strong> {selectedLead.designation}
                      </div>
                    )}
                    {selectedLead?.phone_numbers &&
                      selectedLead.phone_numbers.length > 0 && (
                        <div>
                          <strong>Phone Numbers:</strong>{" "}
                          {selectedLead.phone_numbers.join(", ")}
                        </div>
                      )}
                    {selectedLead?.emails && selectedLead.emails.length > 0 && (
                      <div>
                        <strong>Emails:</strong>{" "}
                        {selectedLead.emails.join(", ")}
                      </div>
                    )}
                    {selectedLead?.websites &&
                      selectedLead.websites.length > 0 && (
                        <div>
                          <strong>Websites:</strong>{" "}
                          {selectedLead.websites.join(", ")}
                        </div>
                      )}
                    {selectedLead?.other && selectedLead.other.length > 0 && (
                      <div>
                        <strong>Other Info:</strong>{" "}
                        {selectedLead.other.join(", ")}
                      </div>
                    )}
                    {selectedLead?.created_at && (
                      <div>
                        <strong>Created At:</strong>{" "}
                        {formatDate(selectedLead.created_at)}
                      </div>
                    )}
                    {selectedLead?.event_name && (
                      <div>
                        <strong>Event Name:</strong> {selectedLead.event_name}
                      </div>
                    )}
                    {selectedLead?.qr_data && (
                      <div>
                        <strong>QR Data:</strong> {selectedLead.qr_data}
                      </div>
                    )}
                    {selectedLead?.city && (
                      <div>
                        <strong>City:</strong> {selectedLead.city}
                      </div>
                    )}
                    {selectedLead?.state && (
                      <div>
                        <strong>State:</strong> {selectedLead.state}
                      </div>
                    )}
                    {selectedLead?.zip && (
                      <div>
                        <strong>ZIP:</strong> {selectedLead.zip}
                      </div>
                    )}
                    {selectedLead?.country && (
                      <div>
                        <strong>Country:</strong> {selectedLead.country}
                      </div>
                    )}
                    {selectedLead?.area_of_interest && (
                      <div>
                        <strong>Area of Interest:</strong>{" "}
                        {selectedLead.area_of_interest}
                      </div>
                    )}
                    {selectedLead?.disclaimer && (
                      <div>
                        <strong>Disclaimer:</strong>{" "}
                        {selectedLead.disclaimer}
                      </div>
                    )}
                    {selectedLead?.consent && (
                      <div>
                        <strong>Consent:</strong> {selectedLead.consent}
                      </div>
                    )}
                    {selectedLead && (
                      <>
                        <div>
                          <strong>Email Opt In:</strong>{" "}
                          {selectedLead.email_opt_in ? "True" : "False"}
                        </div>
                        <div>
                          <strong>Consent:</strong>{" "}
                          {selectedLead.consent ? "Granted" : "Missing"}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: Image */}
                  {selectedLead?.image_url && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-muted/20 rounded-lg h-fit max-h-[calc(90vh-200px)]">
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-full max-w-xs h-64 flex items-center justify-center bg-background border rounded-lg shadow-md overflow-hidden">
                          <a
                            href={selectedLead.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full h-full p-2"
                          >
                            <img
                              src={selectedLead.image_url}
                              alt="Lead image"
                              className="w-full h-full object-contain rounded border"
                            />
                          </a>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Click image to view full size
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Signature Image */}
                  {selectedLead?.signature && (
                    <div className="col-span-2 flex justify-center">
                      <div className="w-full max-w-md p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <strong className="text-lg">Signature</strong>
                        </div>
                        <div className="w-full h-32 bg-background border rounded-lg shadow-md overflow-hidden flex items-center justify-center">
                          <img
                            src={`data:image/png;base64,${selectedLead.signature}`}
                            alt="Signature"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      </div>
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
