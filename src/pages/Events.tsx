import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Search } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { DateInput } from "@/components/ui/DateInput";

export interface Event {
  event_id: number;
  event_name: string;
  event_status: string;
  start_date: string;
  end_date: string;
  location: string;
  total_leads: number;
  priority_leads: number;
  budget: string;
  event_size: string;
  is_active: string;
  team: string;
  template_id: number | null; // <-- ADD THIS

}

function UpdateEventPopup({
  event,
  onClose,
  onSave,
}: {
  event: Event | null;
  onClose: () => void;
  onSave: (updatedEvent: Event) => void;
}) {
  const [updatedEvent, setUpdatedEvent] = useState<any>({
    event_id: 0,
    event_status: "",
    event_name: "",
    start_date: "",
    end_date: "",
    location: "",
    team: "",
    total_leads: 0,
    priority_leads: 0,
    budget: 1,
    event_size: "medium",
    template_id: "",
    ...event,
  });

  const [teams, setTeams] = useState<string[]>([]);
  const [templateList, setTemplateList] = useState<{ data: any[] }>({ data: [] });
  const [error, setError] = useState<string | null>(null);

  const { request, loading } = useApi<any>();

  // 🔹 Fetch Teams + Templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // TEAM API
        const teamsRes = await request("/get_all_teams", "GET");

        if (Array.isArray(teamsRes)) {
          const teamNames = teamsRes
            .map((t: any) => t.team_name)
            .filter((name: any): name is string => typeof name === "string");

          setTeams(teamNames);
        }

        // TEMPLATE API (response inside data)
        const templateRes = await request("/form_template_list", "GET");

        if (templateRes?.data && Array.isArray(templateRes.data)) {
          setTemplateList({ data: templateRes.data });
        }
      } catch (err) {
        console.error("API error:", err);
      }
    };

    fetchData();
  }, []);

  // 🔹 Pre-fill template_id as string
  useEffect(() => {
    if (event) {
      setUpdatedEvent({
        ...event,
        template_id: event.template_id ? String(event.template_id) : "",
      });
    }
  }, [event]);

  // 🔹 Handle all input changes
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setUpdatedEvent((prev: any) => ({
      ...prev,
      [name]:
        ["total_leads", "priority_leads", "budget"].includes(name)
          ? Number(value)
          : value,
    }));
  };

  // 🔹 Save API using useApi
  const handleSave = async () => {
    setError(null);

    // ✅ Remove fields from payload using destructuring
    const { fields, ...cleanEvent } = updatedEvent;

    const payload = {
      ...cleanEvent,
      template_id:
        cleanEvent.template_id === "" ? null : Number(cleanEvent.template_id),
    };

    try {
      const res = await request(
        `/update_event?event_id=${updatedEvent.event_id}`,
        "PUT",
        payload
      );

      if (!res) throw new Error("Failed to update event");

      onSave(payload);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    }
  };


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg relative">
          <h2 className="text-lg font-semibold mb-6">Update Event</h2>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Status */}
            <label className="block">
              <span className="text-sm font-medium">Event Status</span>
              <select
                name="event_status"
                value={updatedEvent.event_status}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            {/* Event Name */}
            <label className="block">
              <span className="text-sm font-medium">Event Name</span>
              <input
                name="event_name"
                value={updatedEvent.event_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                type="text"
              />
            </label>

            {/* Dates */}
            <DateInput
              label="Start Date"
              value={updatedEvent.start_date}
              onChange={(val) =>
                setUpdatedEvent((p: any) => ({ ...p, start_date: val }))
              }
            />
            <DateInput
              label="End Date"
              value={updatedEvent.end_date}
              onChange={(val) =>
                setUpdatedEvent((p: any) => ({ ...p, end_date: val }))
              }
            />

            {/* Location */}
            <label className="block">
              <span className="text-sm font-medium">Location</span>
              <input
                name="location"
                value={updatedEvent.location}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                type="text"
              />
            </label>

            {/* Team */}
            <label className="block">
              <span className="text-sm font-medium">Team</span>
              <select
                name="team"
                value={updatedEvent.team}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="">Select a team</option>
                {teams.map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {/* Leads */}
            <label className="block">
              <span className="text-sm font-medium">Total Leads</span>
              <input
                name="total_leads"
                value={updatedEvent.total_leads}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                type="number"
                min={0}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Priority Leads</span>
              <input
                name="priority_leads"
                value={updatedEvent.priority_leads}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                type="number"
                min={0}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Budget</span>
              <input
                name="budget"
                value={updatedEvent.budget}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                type="number"
                min={0}
              />
            </label>

            {/* Event Size */}
            <label className="block">
              <span className="text-sm font-medium">Event Size</span>
              <select
                name="event_size"
                value={updatedEvent.event_size}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>

            {/* Template Dropdown */}
            <label className="block col-span-2">
              <span className="text-sm font-medium">Form Template</span>
              <select
                name="template_id"
                value={updatedEvent.template_id || ""}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Template</option>

                {templateList.data.length === 0 && (
                  <option disabled>No templates found</option>
                )}

                {templateList.data.map((tpl: any) => (
                  <option key={tpl.id} value={String(tpl.id)}>
                    {tpl.template_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}





const getStatusBadge = (status: string) => {
  switch (status) {
    case "Upcoming":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">
          Upcoming
        </Badge>
      );
    case "Active":
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100/80">
          Active
        </Badge>
      );
    case "Completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">
          Completed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function Events() {
  const { request, loading, error } = useApi<Event[]>();
  const [events, setEvents] = useState<Event[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      const data: any = await request("/get_all_event_details", "GET");
      if (data?.data) setEvents(data.data);
      else setEvents([]);
    };
    fetchEvents();
  }, []);

  const openUpdatePopup = (event: Event) => {
    setSelectedEvent(event);
    setPopupOpen(true);
  };

  const closeUpdatePopup = () => {
    setPopupOpen(false);
    setSelectedEvent(null);
  };

  const handleSave = (updatedEvent: Event) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.event_id === updatedEvent.event_id ? updatedEvent : ev))
    );
    closeUpdatePopup();
  };

  const getStatusFromDates = (event: any, start: string, end: string) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if ((now >= startDate || event.event_status === "Active") && now <= endDate)
      return "Active";
    else if (now < startDate) return "Upcoming";
    else if (now > endDate) return "Completed";
    return "Unknown";
  };

  const filteredEvents = events
    .filter((event) => {
      const statusMatch =
        status === "All" || getStatusFromDates(event, event.start_date, event.end_date) === status;
      const searchMatch = [event.event_name, event.team, event.location]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    })
    .sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

  const handleClearFilters = () => {
    setStatus("All");
    setSearchTerm("");
  };


  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex justify-between items-center space-x-6">
            <h1 className="text-2xl font-semibold text-foreground">Your Events</h1>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-md w-60 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              </div>
            <div className="flex items-center space-x-4">
              

              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="w-40 border border-gray-300 rounded">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleClearFilters}>
                Clear Filter
              </Button>
            </div>
          </div>

          {loading && <p>Loading events...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Event Name</th>
                      <th className="py-3 px-4 text-left">Dates</th>
                      <th className="py-3 px-4 text-left">Location</th>
                      <th className="py-3 px-4 text-left">Team</th>
                      <th className="py-3 px-4 text-left">Leads</th>
                      <th className="py-3 px-4 text-left">Priority</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr
                        key={event.event_id}
                        className="border-b hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          {getStatusBadge(
                            getStatusFromDates(event, event.start_date, event.end_date)
                          )}
                        </td>
                        <td className="py-3 px-4">{event.event_name}</td>
                        <td className="py-3 px-4">
                          {event.start_date} → {event.end_date}
                        </td>
                        <td className="py-3 px-4">{event.location}</td>
                        <td className="py-3 px-4">{event.team}</td>
                        <td className="py-3 px-4">{event.total_leads}</td>
                        <td className="py-3 px-4">{event.priority_leads}</td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openUpdatePopup(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {popupOpen && selectedEvent && (
        <UpdateEventPopup
          event={selectedEvent}
          onClose={closeUpdatePopup}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
