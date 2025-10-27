import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast"; // ✅ added toast

const teamsData = {
  totalEvents: 265,
  totalLeads: 5176,
  priorityLeads: 297,
  avgLeadsPerEvent: 19.53,
  priorityPercentage: "5.74%",
};

export default function Teams() {
  const { request, loading } = useApi<any>();
  const [leadData, setLeadData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [eventNameFilter, setEventNameFilter] = useState("");
  const { toast } = useToast(); // ✅ initialize toast

  // ✅ Fetch lead data
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

  // ✅ Delete lead
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

  // ✅ Filtering and pagination
  const filteredLeads = leadData.filter((lead) =>
    lead.event_name?.toLowerCase().includes(eventNameFilter.toLowerCase())
  );

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventNameFilter(e.target.value);
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
            <p className="text-muted-foreground mb-4">
              Here is your Lead Data
            </p>
          </div>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
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
                          {lead?.designation}
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
                          <Button
                            onClick={() => handleDelete(lead?.lead_id)}
                            variant="link"
                            className="text-primary p-0 h-auto"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
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

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">© iCapture 2025</p>
          </div>
        </main>
      </div>
    </div>
  );
}
