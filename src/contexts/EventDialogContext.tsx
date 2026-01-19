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
  DialogFooter,
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
// Multi-select components
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
import { Check, ChevronsUpDown, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState<string[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    // Step 1 Fields
    owner: "",
    eventName: "",
    eventType: "",
    status: "Upcoming",
    region: "",
    location: "",
    startDate: "",
    endDate: "",

    // Step 2 Fields
    team: "",
    budget: 0,
    currency: "USD",
    eventSize: "",
    priorityLeads: 0,
    lead_type: [] as string[],
    capture_type: [] as string[],
  });
  const getEmail = localStorage.getItem("email") || "";

  // UI Helper States
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // ================= FETCH TEAMS =================
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await request("/get_all_teams", "GET");
        if (res?.length > 0) {
          const teamNames: any = Array.from(
            new Set(res.map((team: any) => team.team_name).filter(Boolean))
          );
          setTeams(teamNames);
        }
      } catch (err) {
        console.error("Failed to fetch teams", err);
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

  const toggleArrayItem = (field: "lead_type" | "capture_type", value: string) => {
    setFormData((prev) => {
      const currentList = prev[field];
      const newList = currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];
      return { ...prev, [field]: newList };
    });
  };

  // ================= VALIDATION =================
  const validateStep1 = () => {
    const required = [
      { field: "owner", label: "Event Owner" },
      { field: "eventName", label: "Event Name" },
      { field: "eventType", label: "Type of Event" },
      { field: "region", label: "Region" },
      { field: "location", label: "Location" },
      { field: "startDate", label: "Start Date" },
      { field: "endDate", label: "End Date" },
    ];

    for (const { field, label } of required) {
      if (!formData[field as keyof typeof formData]) {
        toast({ variant: "destructive", title: "Missing Field", description: `${label} is required.` });
        return false;
      }
    }

    if (formData.endDate < formData.startDate) {
      toast({ variant: "destructive", title: "Invalid Dates", description: "End date cannot be before start date." });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.lead_type.length === 0) {
      toast({ variant: "destructive", title: "Missing Field", description: "Select at least one Lead Type." });
      return false;
    }
    if (formData.capture_type.length === 0) {
      toast({ variant: "destructive", title: "Missing Field", description: "Select at least one Capture Type." });
      return false;
    }
    if (!formData.team) {
      toast({ variant: "destructive", title: "Missing Field", description: "Select at least one Team." });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    const payload = {
      event_owner: getEmail,
      event_name: formData.eventName,
      event_type: formData.eventType,
      event_status: formData.status,
      region: formData.region,
      location: formData.location,
      start_date: formData.startDate,
      end_date: formData.endDate,
      team: formData.team,
      budget: `${formData.currency} ${formData.budget}`,
      event_size: formData.eventSize,
      priority_leads: formData.priorityLeads,
      lead_type: formData.lead_type,
      capture_type: formData.capture_type,
      total_leads: 0,
    };

    console.log("📤 Creating event:", payload);
    const res = await request("/create_events", "POST", payload);

    if (res?.message === "Event created successfully" || res?.success) {
      toast({ title: "✅ Event Created", description: "Event has been created successfully." });
      closeEventDialog();
      window.location.href="/events";
    } else {
      toast({ variant: "destructive", title: "❌ Failed", description: res?.msg || "Failed to save event." });
    }
  };

  const openEventDialog = () => {
    setIsOpen(true);
    setStep(1);
    setFormData({
      owner: getEmail,
      eventName: "",
      eventType: "",
      status: "Upcoming",
      region: "",
      location: "",
      startDate: "",
      endDate: "",
      team: "",
      budget: 0,
      currency: "USD",
      eventSize: "",
      priorityLeads: 0,
      lead_type: [],
      capture_type: [],
    });
    setSelectedTeams([]);
  };

  const closeEventDialog = () => setIsOpen(false);

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={step === 1 ? 50 : 100} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">Step {step} of 2</span>
            </div>
          </DialogHeader>

          <div className="flex-1 py-4">
            {/* ================= STEP 1 ================= */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Event Owner */}
                <div className="col-span-2">
                  <Label htmlFor="owner">Event Owner *</Label>
                  <Input
                    id="owner"
                    placeholder="Enter owner name"
                    value={getEmail}
                    onChange={handleChange}
                    className="border-gray focus:border-gray" // ⭐ Added
                    disabled
                  />
                </div>

                {/* Event Name */}
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    placeholder="e.g., Tech Summit 2026"
                    value={formData.eventName}
                    onChange={handleChange}
                    className="border-gray focus:border-gray" // ⭐ Added
                  />
                </div>

                {/* Event Type */}
                <div>
                  <Label>Type of Event *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(val) => handleSelectChange("eventType", val)}
                  >
                    <SelectTrigger className="border-gray focus:border-gray"> {/* ⭐ Added */}
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tradeshow">Tradeshow</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => handleSelectChange("status", val)}
                  >
                    <SelectTrigger className="border-gray focus:border-gray"> {/* ⭐ Added */}
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="In progress">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Region */}
                <div>
                  <Label>Region *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(val) => handleSelectChange("region", val)}
                  >
                    <SelectTrigger className="border-gray focus:border-gray"> {/* ⭐ Added */}
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NA">North America (NA)</SelectItem>
                      <SelectItem value="EMEA">EMEA</SelectItem>
                      <SelectItem value="APAC">APAC</SelectItem>
                      <SelectItem value="LATAM">LATAM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <Label>Event Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(val) => handleSelectChange("location", val)}
                  >
                    <SelectTrigger className="border-gray focus:border-gray"> {/* ⭐ Added */}
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New York">New York</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates (Assuming DateInput accepts className or applies styles internally, passing for wrapper if needed) */}
                <DateInput
                  label="Start Date "
                  value={formData.startDate}
                  required
                  onChange={(val) => setFormData((prev) => ({ ...prev, startDate: val }))}
                  // Ensure your DateInput component uses this prop if available, otherwise check its internal implementation
                />
                <DateInput
                  label="End Date "
                  value={formData.endDate}
                  required
                  minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                  onChange={(val) => setFormData((prev) => ({ ...prev, endDate: val }))}
                />
              </div>
            )}

            {/* ================= STEP 2 ================= */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Team Multi-select */}
                <div className="col-span-2">
                  <Label>Select Team(s) *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        role="combobox" 
                        className="w-full justify-between border-gray focus:border-gray" // ⭐ Added
                      >
                        {selectedTeams.length > 0
                          ? `${selectedTeams.length} team(s) selected`
                          : "Select teams..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search teams..." />
                        <CommandEmpty>No teams found.</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-auto">
                          {teams.map((team) => (
                            <CommandItem key={team} value={team} onSelect={() => handleTeamSelection(team)}>
                              <Check className={`mr-2 h-4 w-4 ${selectedTeams.includes(team) ? "opacity-100" : "opacity-0"}`} />
                              {team}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTeams.map((team) => (
                      <Badge key={team} variant="secondary" className="text-xs" onClick={() => handleTeamSelection(team)}>
                        {team} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="col-span-1">
                  <Label>Budget</Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={formData.currency}
                      onValueChange={(val) => handleSelectChange("currency", val)}
                    >
                      <SelectTrigger className="w-[80px] border-gray focus:border-gray"> {/* ⭐ Added */}
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="Amount"
                      value={formData.budget}
                      onChange={handleChange}
                      className="border-gray focus:border-gray" // ⭐ Added
                    />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <Label>Event Size</Label>
                  <Select
                    value={formData.eventSize}
                    onValueChange={(val) => handleSelectChange("eventSize", val)}
                  >
                    <SelectTrigger className="mt-1 border-gray focus:border-gray"> {/* ⭐ Added */}
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (&lt; 100)</SelectItem>
                      <SelectItem value="medium">Medium (100-500)</SelectItem>
                      <SelectItem value="large">Large (&gt; 500)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Priority */}
                <div>
                  <Label htmlFor="priorityLeads">Priority Leads</Label>
                  <Input
                    id="priorityLeads"
                    type="number"
                    value={formData.priorityLeads}
                    onChange={handleChange}
                    className="mt-1 border-gray focus:border-gray" // ⭐ Added
                  />
                </div>

                {/* Lead Type */}
                <div className="col-span-2 border-t pt-4">
                  <Label className="text-base font-semibold">Lead Type *</Label>
                  <p className="text-xs text-muted-foreground mb-3">How are leads collected physically?</p>
                  <div className="flex gap-3">
                    {["Visiting Card", "Badge", "Manual"].map((type) => (
                      <Badge
                        key={type}
                        variant={formData.lead_type.includes(type) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 ${!formData.lead_type.includes(type) ? "border-gray" : ""}`} // ⭐ Added conditional border
                        onClick={() => toggleArrayItem("lead_type", type)}
                      >
                        {type}
                        {formData.lead_type.includes(type) && <Check className="ml-2 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Capture Type */}
                <div className="col-span-2 border-t pt-4">
                  <Label className="text-base font-semibold">Capture Type *</Label>
                  <p className="text-xs text-muted-foreground mb-3">Select the form strategy</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "checkbox", label: "Checkbox", desc: "Simple tick selection" },
                      { id: "booth", label: "Booth Give Away", desc: "Gamified entry" },
                      { id: "full", label: "Full Lead Form", desc: "Detailed data entry" },
                    ].map(({ id, label, desc }) => (
                      <div
                        key={id}
                        onClick={() => toggleArrayItem("capture_type", label)}
                        className={`
                          cursor-pointer border rounded-lg p-3 transition-all
                          ${formData.capture_type.includes(label) 
                            ? "border-primary bg-primary/10 ring-1 ring-primary" 
                            : "hover:bg-accent border-gray"} // ⭐ Added border-gray
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{label}</span>
                          {formData.capture_type.includes(label) && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between w-full border-t pt-4">
            {step === 1 ? (
              <Button variant="ghost" onClick={closeEventDialog}>Cancel</Button>
            ) : (
              <Button variant="outline" onClick={handleBack} className="border-gray"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
            )}

            {step === 1 ? (
              <Button onClick={handleNext}>Next Step <ArrowRight className="ml-2 h-4 w-4"/></Button>
            ) : (
              <Button onClick={handleSubmit}>Create Event</Button>
            )}
          </DialogFooter>

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