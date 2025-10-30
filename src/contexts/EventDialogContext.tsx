import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";

type EventDialogContextType = {
  openEventDialog: (event?: any) => void;
  closeEventDialog: () => void;
};

const EventDialogContext = createContext<EventDialogContextType | undefined>(
  undefined
);

export function EventDialogProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const { request } = useApi<any>();

  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    status: "Upcoming",
    team: "",
    eventName: "",
    startDate: "",
    endDate: "",
    location: "",
    totalLeads: 0,
    priorityLeads: 0,
    budget: 0,
    eventSize: "",
  });

  // ✅ Fetch Teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await request("/get_all_teams", "GET");
        if (res?.length > 0) {
          const teamNames = Array.from(
            new Set(res.map((team: any) => team.team_name).filter(Boolean))
          );
          setTeams(teamNames);
        } else {
          toast({
            variant: "destructive",
            title: "❌ Failed to Fetch Teams",
            description: res?.msg || "Unable to load team list.",
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "⚠️ Network Error",
          description: "Could not fetch team list. Please try again later.",
        });
      }
    };
    fetchTeams();
  }, []);

  // ✅ Prefill data when editing event
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        status: editingEvent.event_status || "Upcoming",
        team: editingEvent.team || "",
        eventName: editingEvent.event_name || "",
        startDate: editingEvent.start_date || "",
        endDate: editingEvent.end_date || "",
        location: editingEvent.location || "",
        totalLeads: editingEvent.total_leads || 0,
        priorityLeads: editingEvent.priority_leads || 0,
        budget: editingEvent.budget || 0,
        eventSize: editingEvent.event_size || "",
      });
    }
  }, [editingEvent]);

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const requiredFields = [
      { field: "status", label: "Event Status" },
      { field: "team", label: "Team" },
      { field: "eventName", label: "Event Name" },
      { field: "startDate", label: "Start Date" },
      { field: "endDate", label: "End Date" },
      { field: "location", label: "Event Location" },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          variant: "destructive",
          title: "⚠️ Missing Required Field",
          description: `${label} is required.`,
        });
        return;
      }
    }

    if (formData.endDate < formData.startDate) {
      toast({
        variant: "destructive",
        title: "⚠️ Invalid Range",
        description: "End date cannot be before the start date.",
      });
      return;
    }

    const payload = {
      event_status: formData.status,
      event_name: formData.eventName,
      start_date: formData.startDate,
      end_date: formData.endDate,
      location: formData.location,
      team: formData.team,
      total_leads: formData.totalLeads,
      priority_leads: formData.priorityLeads,
      budget: formData.budget,
      event_size: formData.eventSize,
    };

    const endpoint = editingEvent ? "/update_event" : "/create_events";
    const res = await request(endpoint, "POST", {
      ...(editingEvent && { event_id: editingEvent.event_id }),
      ...payload,
    });

    if (
      res?.message === "Event updated successfully" ||
      res?.message === "Event created successfully"
    ) {
      toast({
        title: editingEvent ? "✅ Event Updated" : "✅ Event Created",
        description: `Event has been ${
          editingEvent ? "updated" : "created"
        } successfully.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "❌ Failed",
        description: res?.msg || "Failed to save event details.",
      });
    }

    closeEventDialog();
  };

  // 🟢 Open Dialog (with or without edit data)
  const openEventDialog = (event?: any) => {
    if (event) {
      setEditingEvent(event);
    } else {
      setEditingEvent(null);
      setFormData({
        status: "Upcoming",
        team: "",
        eventName: "",
        startDate: "",
        endDate: "",
        location: "",
        totalLeads: 0,
        priorityLeads: 0,
        budget: 0,
        eventSize: "",
      });
    }
    setIsOpen(true);
  };

  const closeEventDialog = () => {
    setIsOpen(false);
    setEditingEvent(null);
  };

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create a New Event"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* Event Status */}
            <div>
              <Label>Event Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => handleSelectChange("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Team */}
            <div>
              <Label>Select Team *</Label>
              <Select
                value={formData.team}
                onValueChange={(val) => handleSelectChange("team", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.length > 0 ? (
                    teams.map((team, idx) => (
                      <SelectItem key={idx} value={team}>
                        {team}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No teams available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Event Name */}
            <div>
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="Enter event name"
                value={formData.eventName}
                onChange={handleChange}
              />
            </div>

            {/* Event Size */}
            <div>
              <Label htmlFor="eventSize">Event Size</Label>
              <Select
                value={formData.eventSize}
                onValueChange={(val) => handleSelectChange("eventSize", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                min={today}
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                min={today}
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Event Location *</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            {/* Budget */}
            <div>
              <Label htmlFor="budget">Approximate Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
              />
            </div>

            {/* Total Leads */}
            <div>
              <Label htmlFor="totalLeads">Total Leads</Label>
              <Input
                id="totalLeads"
                type="number"
                value={formData.totalLeads}
                onChange={handleChange}
              />
            </div>

            {/* Priority Leads */}
            <div>
              <Label htmlFor="priorityLeads">Priority Leads</Label>
              <Input
                id="priorityLeads"
                type="number"
                value={formData.priorityLeads}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-2 pt-6">
            <Button variant="outline" onClick={closeEventDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              {editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </EventDialogContext.Provider>
  );
}

export function useEventDialog() {
  const context = useContext(EventDialogContext);
  if (context === undefined) {
    throw new Error("useEventDialog must be used within an EventDialogProvider");
  }
  return context;
}
