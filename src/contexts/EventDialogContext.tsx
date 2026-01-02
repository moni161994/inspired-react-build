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
// ⭐ ADDED — Multi-select components
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
import { Check, ChevronsUpDown, Search } from "lucide-react";
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
  const [teams, setTeams] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    status: "Upcoming",
    team: "", // ⭐ CHANGED — Now stores comma-separated team names
    eventName: "",
    startDate: "",
    endDate: "",
    location: "",
    totalLeads: 0,
    priorityLeads: 0,
    budget: 0,
    eventSize: "",
    template_id: "",
  });

  // ⭐ ADDED — Selected teams array for UI management
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // ================= FETCH TEAMS =================
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

  // ================= FETCH TEMPLATE LIST =================
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

  // ⭐ ADDED — Handle multiple team selection
  const handleTeamSelection = (team: string) => {
    const newSelectedTeams = selectedTeams.includes(team)
      ? selectedTeams.filter((t) => t !== team)
      : [...selectedTeams, team];
    
    setSelectedTeams(newSelectedTeams);
    setFormData((prev) => ({
      ...prev,
      team: newSelectedTeams.join(", "), // Comma-separated for API
    }));
  };

  // ================= SUBMIT FORM =================
  const handleSubmit = async () => {
    const requiredFields = [
      { field: "status", label: "Event Status" },
      { field: "team", label: "Team(s)" }, // ⭐ UPDATED label
      { field: "eventName", label: "Event Name" },
      { field: "startDate", label: "Start Date" },
      { field: "endDate", label: "End Date" },
      { field: "location", label: "Event Location" },
      { field: "template_id", label: "Template" },
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
      team: formData.team, // ⭐ Already comma-separated
      total_leads: 0,
      priority_leads: formData.priorityLeads,
      budget: formData.budget,
      event_size: formData.eventSize,
      template_id: formData.template_id,
    };

    const res = await request("/create_events", "POST", payload);

    if (res?.message === "Event updated successfully") {
      toast({
        title: "✅ Event Created",
        description: "Event has been created successfully.",
      });
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
      template_id: "",
    });
    setSelectedTeams([]); // ⭐ RESET selected teams
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
            
            {/* EVENT STATUS */}
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

            {/* ⭐ MULTI-SELECT TEAMS */}
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
              {/* ⭐ SHOW SELECTED TEAMS AS BADGES */}
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
                placeholder="Enter event name"
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
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
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
              minDate={
                formData.startDate ? new Date(formData.startDate) : new Date()
              }
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, endDate: val }))
              }
            />

            {/* LOCATION */}
            <div>
              <Label htmlFor="location">Event Location *</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div>

            {/* BUDGET */}
            <div>
              <Label htmlFor="budget">Approximate Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div>

            {/* TOTAL LEADS */}
            {/* <div>
              <Label htmlFor="totalLeads">Total Leads</Label>
              <Input
                id="totalLeads"
                type="number"
                value={0}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div> */}

            {/* PRIORITY LEADS */}
            <div>
              <Label htmlFor="priorityLeads">Priority Leads</Label>
              <Input
                id="priorityLeads"
                type="number"
                value={formData.priorityLeads}
                onChange={handleChange}
                className="border-gray focus:border-gray"
              />
            </div>

            {/* TEMPLATE */}
            <div className="col-span-2">
              <Label>Select Template *</Label>
              <Select
                value={formData.template_id}
                onValueChange={(val) =>
                  handleSelectChange("template_id", val)
                }
              >
                <SelectTrigger className="border-gray focus:border-gray">
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length > 0 ? (
                    templates.map((tpl) => (
                      <SelectItem key={tpl.id} value={String(tpl.id)}>
                        {tpl.template_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No Templates Available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ACTION BUTTONS */}
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
