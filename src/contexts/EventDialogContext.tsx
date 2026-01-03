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
import { DateInput } from "@/components/ui/DateInput";
// ⭐ Multi-select components
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EventDialogContextType = {
  openEventDialog: () => void;
  closeEventDialog: () => void;
};

const EventDialogContext = createContext<EventDialogContextType | undefined>(
  undefined
);

export function EventDialogProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { request } = useApi<any>();

  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // ⭐ Form state with capture_type array
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
    template_id: "",
    capture_type: [],  // 👈 Array: ["Visiting Card", "Badge", "Manual"]
  });

  // ⭐ UI states for multi-selects
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [captureTypes, setCaptureTypes] = useState<string[]>([]);

  // ================= FETCH TEAMS =================
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await request("/get_all_teams", "GET");
        if (res?.length > 0) {
          const teamNames:any = Array.from(
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

  // ================= FETCH TEMPLATES =================
  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await request("/form_template_list", "GET");

      if (res?.success && res.data) {
        setTemplates(res.data);
      } else {
        toast({
          variant: "destructive",
          title: "❌ Failed to Load Templates",
          description: res?.message || "Unable to fetch template list.",
        });
      }
    };

    fetchTemplates();
  }, []);

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ⭐ Team multi-select handler
  const handleTeamSelection = (team: string) => {
    const newSelectedTeams = selectedTeams.includes(team)
      ? selectedTeams.filter((t) => t !== team)
      : [...selectedTeams, team];
    
    setSelectedTeams(newSelectedTeams);
    setFormData((prev) => ({
      ...prev,
      team: newSelectedTeams.join(", "),
    }));
  };

  // ⭐ Capture type checkbox handler
  const toggleCaptureType = (type: string) => {
    const newCaptureTypes = captureTypes.includes(type)
      ? captureTypes.filter((t) => t !== type)
      : [...captureTypes, type];
    
    setCaptureTypes(newCaptureTypes);
    setFormData((prev) => ({
      ...prev,
      capture_type: newCaptureTypes,  // 👈 Direct array to API
    }));
  };

  // ================= VALIDATION & SUBMIT =================
  const handleSubmit = async () => {
    const requiredFields = [
      { field: "status", label: "Event Status" },
      { field: "team", label: "Team(s)" },
      { field: "eventName", label: "Event Name" },
      { field: "startDate", label: "Start Date" },
      { field: "endDate", label: "End Date" },
      { field: "location", label: "Event Location" },
      { field: "capture_type", label: "Capture Type(s)" },  // 👈 NEW
      { field: "template_id", label: "Template" },
    ];

    // Check required fields
    for (const { field, label } of requiredFields) {
      const value = formData[field as keyof typeof formData];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        toast({
          variant: "destructive",
          title: "⚠️ Missing Required Field",
          description: `${label} is required.`,
        });
        return;
      }
    }

    // Date validation
    if (formData.endDate < formData.startDate) {
      toast({
        variant: "destructive",
        title: "⚠️ Invalid Range",
        description: "End date cannot be before the start date.",
      });
      return;
    }

    // 👈 API payload with capture_type array
    const payload = {
      event_status: formData.status,
      event_name: formData.eventName,
      start_date: formData.startDate,
      end_date: formData.endDate,
      location: formData.location,
      team: formData.team,
      total_leads: 0,
      priority_leads: formData.priorityLeads,
      budget: formData.budget,
      event_size: formData.eventSize,
      template_id: formData.template_id,
      capture_type: formData.capture_type,  // 👈 ["Visiting Card", "Badge", "Manual"]
    };

    console.log("📤 Creating event:", payload);

    const res = await request("/create_events", "POST", payload);

    if (res?.message === "Event created successfully" || res?.success) {
      toast({
        title: "✅ Event Created",
        description: "Event has been created successfully.",
      });
      closeEventDialog();
      window.location.href="/events"; // Refresh to events list
    } else {
      toast({
        variant: "destructive",
        title: "❌ Failed",
        description: res?.msg || res?.message || "Failed to save event details.",
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
      template_id: "",
      capture_type: [],  // 👈 Reset
    });
    setSelectedTeams([]);
    setCaptureTypes([]);  // 👈 Reset
  };

  const closeEventDialog = () => {
    setIsOpen(false);
  };

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      {/* 👇 MAIN CREATE EVENT DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Event</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* STATUS */}
            <div>
              <Label>Event Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => handleSelectChange("status", val)}
              >
                <SelectTrigger className="border-gray focus:border-gray">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="In progress">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 👇 MULTI-SELECT TEAMS */}
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
                            className={`mr-2 h-4 w-4 ${
                              selectedTeams.includes(team)
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

            {/* EVENT NAME */}
            <div>
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="e.g., Tech Summit 2026"
                value={formData.eventName}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div>

            {/* EVENT SIZE */}
            <div>
              <Label htmlFor="eventSize">Event Size</Label>
              <Select
                value={formData.eventSize}
                onValueChange={(val) => handleSelectChange("eventSize", val)}
              >
                <SelectTrigger className="border-gray focus:border-gray">
                  <SelectValue placeholder="Select Event Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (&lt; 100)</SelectItem>
                  <SelectItem value="medium">Medium (100-500)</SelectItem>
                  <SelectItem value="large">Large (&gt; 500)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* START DATE */}
            <DateInput
              label="Start Date *"
              value={formData.startDate}
              required
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, startDate: val }))
              }
            />

            {/* END DATE */}
            <DateInput
              label="End Date *"
              value={formData.endDate}
              required
              minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, endDate: val }))
              }
            />

            {/* LOCATION */}
            <div>
              <Label htmlFor="location">Event Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Mumbai Exhibition Centre"
                value={formData.location}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div>

            {/* BUDGET */}
            <div>
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="5000"
                value={formData.budget}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div>

            {/* 👇 NEW: CAPTURE TYPE CHECKBOXES */}
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

            {/* PRIORITY LEADS */}
            <div>
              <Label htmlFor="priorityLeads">Priority Leads Target</Label>
              <Input
                id="priorityLeads"
                type="number"
                placeholder="50"
                value={formData.priorityLeads}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div>

            {/* TEMPLATE - Full width */}
            <div className="col-span-2">
              <Label>Lead Capture Template *</Label>
              <Select
                value={formData.template_id}
                onValueChange={(val) => handleSelectChange("template_id", val)}
              >
                <SelectTrigger className="border-gray focus:border-gray">
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length > 0 ? (
                    templates.map((tpl) => (
                      <SelectItem key={tpl.id} value={String(tpl.id)}>
                        {tpl.template_name} 
                        <span className="text-xs text-muted-foreground ml-2">
                          ID: {tpl.id}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      🔄 Loading templates...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 👇 ACTION BUTTONS */}
          <div className="flex justify-end space-x-3 pt-8 border-t mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={closeEventDialog}
              className="px-8"
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} className="px-8">
              Create Event
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
