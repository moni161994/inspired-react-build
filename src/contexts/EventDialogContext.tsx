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
import { Checkbox } from "@/components/ui/checkbox";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { DateInput } from "@/components/ui/DateInput";

type EventDialogContextType = {
  openEventDialog: () => void;
  closeEventDialog: () => void;
};

const EventDialogContext = createContext<EventDialogContextType | undefined>(
  undefined
);

export function EventDialogProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { request } = useApi<any>();

  const [isOpen, setIsOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);

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
    form_fields: [] as string[],
  });

  // Example available form fields (from your DB table)
  const availableFields = [
    "name",
    "designation",
    "company",
    "phone_numbers",
    "emails",
    "websites",
    "other",
    "city",
    "state",
    "zip",
    "country",
    "area_of_interest",
    "disclaimer",
    "consent_form",
    "term_and_condition",
    "signature",
    "email_opt_in"
  ];

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

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFormField = (field: string) => {
    setFormData((prev) => {
      const exists = prev.form_fields.includes(field);
      const updated = exists
        ? prev.form_fields.filter((f) => f !== field)
        : [...prev.form_fields, field];
      return { ...prev, form_fields: updated };
    });
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
      form_fields: formData.form_fields,
    };

    const res = await request("/create_events", "POST", payload);

    if (res?.message === "Event updated successfully") {
      toast({
        title: "✅ Event Created",
        description: "Event has been created successfully.",
      });
      closeEventDialog();
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
        form_fields: [],
      });
      window.location.href = "/events";
    } else {
      toast({
        variant: "destructive",
        title: "❌ Failed",
        description: res?.msg || "Failed to save event details.",
      });
    }
  };

  const openEventDialog = () => {
    setIsOpen(true);
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
      form_fields: [],
    });
  };

  const closeEventDialog = () => {
    setIsOpen(false);
  };

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      {/* Main Create Event Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create a New Event</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-4">
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
                  <SelectItem value="In progress">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <div>
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="Enter event name"
                value={formData.eventName}
                onChange={handleChange}
              />
            </div>

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

            <DateInput
              label="Start Date *"
              value={formData.startDate}
              required
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, startDate: val }))
              }
            />

            <DateInput
              label="End Date *"
              value={formData.endDate}
              required
              minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, endDate: val }))
              }
            />

            <div>
              <Label htmlFor="location">Event Location *</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="budget">Approximate Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="totalLeads">Total Leads</Label>
              <Input
                id="totalLeads"
                type="number"
                value={formData.totalLeads}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="priorityLeads">Priority Leads</Label>
              <Input
                id="priorityLeads"
                type="number"
                value={formData.priorityLeads}
                onChange={handleChange}
              />
            </div>

            {/* Select Form Button */}
            <div className="col-span-2 flex justify-center pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFormDialogOpen(true)}
              >
                Select Form Fields
              </Button>
            </div>

            {formData.form_fields.length > 0 && (
              <div className="col-span-2 text-sm text-gray-600">
                Selected Fields: {formData.form_fields.join(", ")}
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-2 pt-6">
            <Button variant="outline" onClick={closeEventDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Selection Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Form Fields</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {availableFields.map((field) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id={field}
                  checked={formData.form_fields.includes(field)}
                  onCheckedChange={() => toggleFormField(field)}
                />
                <Label htmlFor={field} className="text-sm capitalize">
                  {field.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={() => setIsFormDialogOpen(false)}
            >
              Done
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
