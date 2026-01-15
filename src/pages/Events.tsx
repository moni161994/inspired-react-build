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
import { Check, ChevronsUpDown, Edit, Search, X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { DateInput } from "@/components/ui/DateInput";

// 🔹 IMPORT MISSING ICONS
import { LayoutGrid, Calendar, Clock, UsersIcon, User, Folder, LayoutList } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";

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
  template_id: number | null;
  capture_type: string[];
}

export interface User {
  employee_id: number;
  user_name: string;
  profile: string;
}

// ... [Keep PageOption, ActionOption, AccessPointData interfaces and constants as they were] ...

interface AccessPointData {
  page: string[];
  point: string[];
  user_id: number;
}

// ... [Keep UpdateEventPopup component exactly as it was] ...
function UpdateEventPopup({
  event,
  onClose,
  onSave,
}: {
  event: Event | null;
  onClose: () => void;
  onSave: (updatedEvent: Event) => void;
}) {
    // ... [Content of UpdateEventPopup remains unchanged] ...
    // For brevity in this answer, I am assuming the popup code remains 
    // exactly as you provided in your prompt.
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
        capture_type: [],
        ...event,
      });
    
      const [teams, setTeams] = useState<string[]>([]);
      const [templateList, setTemplateList] = useState<{ data: any[] }>({ data: [] });
      const [error, setError] = useState<string | null>(null);
      const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
      const [captureTypes, setCaptureTypes] = useState<string[]>([]);
      const { toast } = useToast();
    
      const { request, loading } = useApi<any>();
    
      useEffect(() => {
        const fetchData = async () => {
          try {
            const teamsRes = await request("/get_all_teams", "GET");
    
            if (Array.isArray(teamsRes)) {
              const teamNames = teamsRes
                .map((t: any) => t.team_name)
                .filter((name: any): name is string => typeof name === "string");
    
              setTeams(teamNames);
            }
    
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
    
      // 🔹 SYNC SELECTED TEAMS FROM EVENT PROP (after teams load)
      useEffect(() => {
        if (event?.team && teams.length > 0) {
          const initialTeams = event.team
            .split(", ")
            .filter((t: string) => teams.includes(t));
          setSelectedTeams(initialTeams);
          setUpdatedEvent((prev: any) => ({ ...prev, team: initialTeams.join(", ") }));
        }
      }, [event?.team, teams]);
    
      useEffect(() => {
        let parsedCaptureTypes: string[] = [];
    
        if (event?.capture_type) {
          try {
            // 👈 Parse JSON string like "[\"Badge\",\"Manual\"]"
            if (typeof event.capture_type === 'string') {
              parsedCaptureTypes = JSON.parse(event.capture_type);
            } else if (Array.isArray(event.capture_type)) {
              parsedCaptureTypes = event.capture_type;
            }
          } catch (err) {
            console.error("Capture type parse error:", err);
            parsedCaptureTypes = [];
          }
        }
    
        setCaptureTypes(parsedCaptureTypes);
        setUpdatedEvent((prev: any) => ({ ...prev, capture_type: parsedCaptureTypes }));
      }, [event?.capture_type]);
    
    
      useEffect(() => {
        if (event) {
          setUpdatedEvent({
            ...event,
            template_id: event.template_id ? String(event.template_id) : "",
          });
        }
      }, [event]);
    
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
    
      const handleSave = async () => {
        setError(null);
    
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
    
          if (!res){
            toast({
              title: "Failed to update event",
              description: "An error occurred while updating event.",
              variant: "destructive",
            });
            throw new Error("Failed to update event");
          }
    
          toast({
            title: "Event Updated Successfully",
            description: "Event data is updated and Save Successfully.",
          });
            //  throw new Error("Failed to update event");
    
          onSave(payload);
        } catch (err: any) {
          setError(err.message || "An error occurred while saving.");
        }
      };
    
      const handleTeamSelection = (team: string) => {
        const newSelectedTeams = selectedTeams.includes(team)
          ? selectedTeams.filter((t) => t !== team)
          : [...selectedTeams, team];
    
        setSelectedTeams(newSelectedTeams);
        setUpdatedEvent((prev: any) => ({
          ...prev,
          team: newSelectedTeams.join(", "),
        }));
      };
    
      const toggleCaptureType = (type: string) => {
        const newCaptureTypes = captureTypes.includes(type)
          ? captureTypes.filter((t) => t !== type)
          : [...captureTypes, type];
    
        setCaptureTypes(newCaptureTypes);
        setUpdatedEvent((prev) => ({
          ...prev,
          capture_type: newCaptureTypes,
        }));
      };
    
      return (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-lg relative">
              <h2 className="text-lg font-semibold mb-6">Update Event</h2>
    
              {error && <p className="text-red-500 mb-4">{error}</p>}
    
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Event Status *</span>
                  <select
                    name="event_status"
                    value={updatedEvent.event_status}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
                  </select>
                </label>
                <div>
                  <Label>Select Team(s) *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between border-gray focus:border-gray h-10"
                      >
                        {selectedTeams.length > 0
                          ? `${selectedTeams.length} team(s) selected`
                          : "Select teams..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 max-h-64">
                      <Command>
                        <CommandInput placeholder="Search teams..." className="h-9" />
                        <CommandEmpty>No teams found.</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-auto">
                          {teams.map((team) => (
                            <CommandItem
                              key={team}
                              value={team}
                              onSelect={() => handleTeamSelection(team)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedTeams.includes(team)
                                  ? "opacity-100"
                                  : "opacity-0"
                                  }`}
                              />
                              {team}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedTeams.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTeams.map((team) => (
                        <Badge
                          key={team}
                          variant="secondary"
                          className="text-xs"
                          onClick={() => handleTeamSelection(team)}
                        >
                          {team} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <label className="block">
                  <span className="text-sm font-medium">Event Name *</span>
                  <input
                    name="event_name"
                    value={updatedEvent.event_name}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    type="text"
                  />
                </label>
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
                <DateInput
                  label="Start Date"
                  value={updatedEvent.start_date}
                  required
                  onChange={(val) =>
                    setUpdatedEvent((p: any) => ({ ...p, start_date: val }))
                  }
                />
                <DateInput
                  label="End Date"
                  value={updatedEvent.end_date}
                  required
                  onChange={(val) =>
                    setUpdatedEvent((p: any) => ({ ...p, end_date: val }))
                  }
                />
    
                <label className="block">
                  <span className="text-sm font-medium">Event Location *</span>
                  <input
                    name="location"
                    value={updatedEvent.location}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    type="text"
                  />
                </label>
    
    
    
                
    
                <label className="block">
                  <span className="text-sm font-medium">Budget (USD)</span>
                  <input
                    name="budget"
                    value={updatedEvent.budget}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    type="number"
                    min={0}
                  />
                </label>
    
                <div className="col-span-2">
                  <Label>Capture Type(s) *</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2 p-4 border border-gray rounded-lg bg-gradient-to-r from-muted to-gray">
                    {[
                      { id: "visiting-card", label: "Visiting Card", value: "Visiting Card" },
                      { id: "badge", label: "Badge", value: "Badge" },
                      { id: "manual", label: "Manual", value: "Manual" },
                    ].map(({ id, label, value }) => (
                      <label
                        key={id}
                        className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-all group"
                      >
                        <input
                          type="checkbox"
                          id={id}
                          checked={captureTypes.includes(value)}
                          onChange={() => toggleCaptureType(value)}
                          className="w-5 h-5 text-primary focus:ring-primary border-gray rounded group-hover:border-primary transition-all"
                        />
                        <div>
                          <span className="font-medium text-sm">{label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {value === "Visiting Card" && "Business card scanning"}
                            {value === "Badge" && "ID badge OCR"}
                            {value === "Manual" && "Form entry"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
    
                  {/* Selected badges */}
                  {captureTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 p-2 bg-accent rounded">
                      {captureTypes.map((type) => (
                        <Badge
                          key={type}
                          variant="default"
                          className="text-xs cursor-pointer hover:bg-primary"
                          onClick={() => toggleCaptureType(type)}
                        >
                          {type} ×
                        </Badge>
                      ))}
                    </div>
                  )}
    
                  {captureTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Select at least one capture method
                    </p>
                  )}
                </div>
    
                <label className="block">
                  <span className="text-sm font-medium">Priority Leads Target</span>
                  <input
                    name="priority_leads"
                    value={updatedEvent.priority_leads}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    type="number"
                    min={0}
                  />
                </label>
    
                <label className="block col-span-2">
                  <span className="text-sm font-medium">Lead Capture Template *</span>
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
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">Upcoming</Badge>;
    case "Active":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100/80">Active</Badge>;
    case "Completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getCurrentUserId = (): number => {
  try {
    const raw = localStorage.getItem("user_id");
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
};

export default function Events() {
  const { request, loading, error } = useApi<Event[]>();
  const [events, setEvents] = useState<Event[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 🔹 FILTER STATES
  const [status, setStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("All"); // 👈 NEW TEMPLATE FILTER STATE

  // 🔹 DATA STATES
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]); // 👈 NEW TEMPLATE DATA STATE

  // 🔹 ACCESS CONTROL STATES
  const [myAccess, setMyAccess] = useState<AccessPointData | null>(null);
  const [canViewEvents, setCanViewEvents] = useState(false);
  const [canEditEvent, setCanEditEvent] = useState(false);
  const [canFilterEvents, setCanFilterEvents] = useState(false);

  const loadMyAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

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

        setCanViewEvents(hasPage("/events") && hasAction("/events", "view_events"));
        setCanEditEvent(hasPage("/events") && hasAction("/events", "edit_event"));
        setCanFilterEvents(hasPage("/events") && hasAction("/events", "filter"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
      setCanViewEvents(false);
      setCanEditEvent(false);
      setCanFilterEvents(false);
    }
  };

  useEffect(() => {
    loadMyAccess();
  }, []);

  // 🔹 FETCH USERS AND TEMPLATES
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUserId = getCurrentUserId();
        
        // Fetch Users
        const userRes = await fetch("https://api.inditechit.com/get_users");
        const userResult = await userRes.json();
        if (userResult.status_code === 200 && Array.isArray(userResult.data)) {
          let list: any = userResult.data;
          if (currentUserId !== 1015) {
            list = list.filter((u: any) => (u.parent_id === currentUserId || u.employee_id == currentUserId));
          }
          setUsers(list);
        }

        // Fetch Templates (Using existing request hook if possible, or direct fetch)
        // Note: Reusing the endpoint logic from UpdateEventPopup
        const tplRes: any = await request("/form_template_list", "GET");
        if (tplRes?.data && Array.isArray(tplRes.data)) {
            setTemplates(tplRes.data);
        }

      } catch (err) {
        console.error("Fetch data error:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      const user_id = getCurrentUserId();
      if (user_id == 1015) {
        const data: any = await request("/get_all_event_details", "GET");
        if (data?.data) setEvents(data.data);
        else setEvents([]);
      } else {
        const getNewEvents = await fetch(`https://api.inditechit.com/get_user_team_events?id=${user_id}`);
        const result = await getNewEvents.json();
        if (result?.data) setEvents(result.data);
      }
    };
    fetchEvents();
  }, []);

  const handleUserSelect = async (userId: number) => {
    const getNewEvents = await fetch(`https://api.inditechit.com/get_user_team_events?id=${userId}`);
    const result = await getNewEvents.json();
    if (result?.data) setEvents(result.data);
    else setEvents([]);
    setSelectedUserId(userId);
  };

  const openUpdatePopup = (event: Event) => {
    if (!canEditEvent) {
      alert("You don't have permission to edit events.");
      return;
    }
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
        
      // 🔹 TEMPLATE MATCH LOGIC
      const templateMatch = selectedTemplateId === "All" || String(event.template_id) === selectedTemplateId;

      return statusMatch && searchMatch && templateMatch;
    })
    .sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    const handleResetToAllEvents = async () => {
      const currentUserId = getCurrentUserId();
      try {
        if (currentUserId === 1015) {
          const data: any = await request("/get_all_event_details", "GET");
          if (data?.data) {
            setEvents(data.data);
          } else {
            setEvents([]);
          }
        } else {
          const response = await fetch(`https://api.inditechit.com/get_user_team_events?id=${currentUserId}`);
          const result = await response.json();
          if (result?.data) {
            setEvents(result.data);
          } else {
            setEvents([]);
          }
        }
      } catch (err) {
        console.error("❌ Reset events error:", err);
        setEvents([]);
      }
      setSelectedUserId(null);
    };
  
    const handleClearFilters = async () => {
      setStatus("All");
      setSearchTerm("");
      setSelectedTemplateId("All"); // 👈 Reset Template Filter
      
      await handleResetToAllEvents();
    };

  const showFilters = canFilterEvents;

  if (myAccess === null) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6 space-y-6">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center animate-spin">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Loading Permissions</h2>
                <p className="text-muted-foreground mb-4">Checking your access to Events page...</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!canViewEvents) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6 space-y-6">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-destructive">Access Denied</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                  You don't have permission to view Events.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" onClick={loadMyAccess} className="w-full">
                    Refresh Permissions
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => window.location.href = "/dashboard"}>
                    Go to Dashboard
                  </Button>
                </div>
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
          <div className="flex justify-between items-center">
            <div className="flex justify-between items-center space-x-6">
              <h1 className="text-2xl font-semibold text-foreground">Your Events</h1>
              {showFilters && (
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
              )}
            </div>
            {showFilters && (
              <div className="flex items-center space-x-4">
                <Select
                  value={selectedUserId?.toString() || "all-events"}
                  onValueChange={async (value) => {
                    if (value === "all-events") {
                      await handleResetToAllEvents();
                    } else {
                      const userId = Number(value);
                      await handleUserSelect(userId);
                    }
                  }}
                >
                  <SelectTrigger className="w-40 border border-gray-300 rounded">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-events">All Users</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.employee_id} value={user.employee_id.toString()}>
                        {user.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v)}
                >
                  <SelectTrigger className="w-40 border border-gray-300 rounded">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                {/* 🔹 NEW TEMPLATE FILTER SELECT */}
                <Select
                  value={selectedTemplateId}
                  onValueChange={(v) => setSelectedTemplateId(v)}
                >
                  <SelectTrigger className="w-44 border border-gray-300 rounded">
                    <SelectValue placeholder="Filter Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Templates</SelectItem>
                    {templates.map((tpl: any) => (
                      <SelectItem key={tpl.id} value={String(tpl.id)}>
                        {tpl.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={handleClearFilters}>
                  Clear Filter
                </Button>
              </div>
            )}
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
                      {/* <th className="py-3 px-4 text-left">Template</th> */}
                      <th className="py-3 px-4 text-left">Priority</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                          {events.length === 0 ? "No events found." : "No events match your filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((event) => (
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
                          {/* <td className="py-3 px-4">
                            {templates.find(t => t.id == event.template_id)?.template_name || "-"}
                          </td> */}
                          <td className="py-3 px-4">{event.priority_leads}</td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openUpdatePopup(event)}
                              disabled={!canEditEvent}
                              title={!canEditEvent ? "No edit permission" : "Edit event"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
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