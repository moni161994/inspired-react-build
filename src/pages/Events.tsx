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
import { Edit } from "lucide-react";
import { useApi } from "@/hooks/useApi";

type Event = {
  event_id: number;
  event_status: string;
  event_name: string;
  start_date: string;
  end_date: string;
  location: string;
  team: string;
  total_leads: number;
  priority_leads: number;
  budget?: number;
  event_size?: string;
};

type Team = {
  team_id: number;
  team_name: string;
};

function UpdateEventPopup({
  event,
  onClose,
  onSave,
}: {
  event: Event | null;
  onClose: () => void;
  onSave: (updatedEvent: Event) => void;
}) {
  const [updatedEvent, setUpdatedEvent] = useState<Event>({
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
    ...event,
  });

  const [teams, setTeams] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch team list dynamically like create event
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("https://api.inditechit.com/get_all_teams");
        const data = await response.json();

        // Ensure type safety: check if `data?.data` is an array
        if (Array.isArray(data)) {
          // Extract team names safely
          const teamNames = data
            .map((t: any) => t.team_name)
            .filter((name: any): name is string => typeof name === "string");

          setTeams(teamNames);
        } else {
          setTeams([]);
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
        setTeams([]);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    setUpdatedEvent({
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
      ...event,
    });
  }, [event]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUpdatedEvent((prev) => ({
      ...prev!,
      [name]:
        name === "total_leads" ||
          name === "priority_leads" ||
          name === "budget"
          ? Number(value)
          : value,
    }));
  };

  const handleSave = async () => {
    if (!updatedEvent) return;
    setError(null);
    try {
      const response = await fetch(
        `https://api.inditechit.com/update_event?event_id=${updatedEvent.event_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: updatedEvent.location,
            team: updatedEvent.team,
            budget: Number(updatedEvent.budget),
            event_size: updatedEvent.event_size,
            event_status: updatedEvent.event_status,
            event_name: updatedEvent.event_name,
            start_date: updatedEvent.start_date,
            end_date: updatedEvent.end_date,
            total_leads: Number(updatedEvent.total_leads),
            priority_leads: Number(updatedEvent.priority_leads),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update event");
      onSave(updatedEvent);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    }
  };

  return (
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
              <option value="In progress">Active</option>
              {/* <option value="Completed">Completed</option> */}
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
          <label className="block">
            <span className="text-sm font-medium">Start Date</span>
            <input
              name="start_date"
              value={updatedEvent.start_date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              type="date"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">End Date</span>
            <input
              name="end_date"
              value={updatedEvent.end_date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              type="date"
            />
          </label>

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

          {/* ✅ Team dropdown with fetched list */}
          <label className="block">
            <span className="text-sm font-medium">Team</span>
            <select
              name="team"
              value={updatedEvent.team}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">
                {loadingTeams ? "Loading teams..." : "Select a team"}
              </option>
              {teams.length > 0 &&
                teams.map((teamName, idx) => (
                  <option key={idx} value={teamName}>
                    {teamName}
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

          {/* Budget */}
          <label className="block">
            <span className="text-sm font-medium">Budget</span>
            <input
              name="budget"
              value={updatedEvent.budget || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              type="number"
              min={0}
              step="any"
            />
          </label>

          {/* Event Size */}
          <label className="block">
            <span className="text-sm font-medium">Event Size</span>
            <input
              name="event_size"
              value={updatedEvent.event_size || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              type="text"
            />
          </label>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
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
    case "In progress":
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100/80">
          In progress
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
  useEffect(() => {
    const fetchEvents = async () => {
      const data: any = await request("/get_all_event_details", "GET");
      if (data?.data) {
        const allEvents = data.data;

        if (status === "All") {
          setEvents(allEvents);
        } else {
          setEvents(
            allEvents.filter((event: Event) =>
              getStatusFromDates(event.start_date, event.end_date) === status
            )
          );
        }
      } else {
        setEvents([]);
      }
    };

    fetchEvents();
  }, [status]);

  // useEffect(() => {
  //   const fetchEvents = async () => {
  //     let url = "/get_all_event_details";
  //     if (status !== "All") {
  //       const filterValue =
  //         status === "Upcoming"
  //           ? "upcoming"
  //           : status === "Completed"
  //             ? "completed"
  //             : status === "In progress"
  //               ? "in_progress"
  //               : "";
  //       if (filterValue) url += `?filter=${filterValue}`;
  //     }
  //     const data: any = await request(url, "GET");
  //     if (data?.data) setEvents(data.data);
  //     else setEvents([]);
  //   };

  //   fetchEvents();
  // }, [status]);

  const openUpdatePopup = (event: Event) => {
    setSelectedEvent(event);
    setPopupOpen(true);
  };

  const getStatusFromDates = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "Upcoming";
    else if (now >= start && now <= end) return "In progress";
    else if (now > end) return "Completed";
    else return "Unknown";
  };


  const closeUpdatePopup = () => {
    setPopupOpen(false);
    setSelectedEvent(null);
  };

  const handleSave = (updatedEvent: Event) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) =>
        ev.event_id === updatedEvent.event_id ? updatedEvent : ev
      )
    );
    closeUpdatePopup();
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Your Events
            </h1>
            <div className="flex items-center space-x-4">
              <Select defaultValue="All" onValueChange={(value) => setStatus(value)}>
                <span className="text-sm text-muted-foreground">Show Events:</span>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="In progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Event Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Event Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Start & End Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Team
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Total Leads
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Priority Leads
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {([...events].sort((a, b) =>
                      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
                    )).map((event, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-4">
                          {getStatusBadge(getStatusFromDates(event.start_date, event.end_date))}
                        </td>

                        <td className="py-3 px-4 text-foreground whitespace-nowrap">
                          {event.event_name}
                        </td>
                        <td className="py-3 px-4 text-foreground whitespace-nowrap">
                          {event.start_date} - {event.end_date}
                        </td>
                        <td className="py-3 px-4 text-foreground whitespace-nowrap">
                          {event.location}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${event.team === "epredia"
                                ? "bg-gray-400"
                                : "bg-purple-400"
                                }`}
                            ></div>
                            <span className="text-foreground">{event.team}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground whitespace-nowrap">
                          {event.total_leads}
                        </td>
                        <td className="py-3 px-4 text-foreground whitespace-nowrap">
                          {event.priority_leads}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdatePopup(event)}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
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

      {popupOpen && (
        <UpdateEventPopup event={selectedEvent} onClose={closeUpdatePopup} onSave={handleSave} />
      )}
    </div>
  );
}
