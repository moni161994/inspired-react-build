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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, ArrowRight, ArrowLeft, Loader2, MapPin } from "lucide-react";
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
  
  // Data Lists
  const [teams, setTeams] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [aoiList, setAoiList] = useState<any[]>([]); // New State for API data
  
  // Location States
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const getEmail = localStorage.getItem("email") || "";
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "Tradeshow",
    template_id: "",
    status: "Upcoming",
    location: "",
    startDate: "",
    endDate: "",
    budget: 0,
    currency: "USD",
    eventSize: "medium",
    priorityLeads: 0,
    lead_type: [] as string[],
    capture_type: [] as string[],
    area_of_interest: [] as string[], // New Field
  });

  // ================= FETCH TEAMS, TEMPLATES & AOI =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Teams
        const teamRes = await request("/get_all_teams", "GET");
        if (teamRes?.length > 0) {
          const names = Array.from(new Set(teamRes.map((t: any) => t.team_name).filter(Boolean)));
          setTeams(names as string[]);
        }
        
        // 2. Templates
        const tplRes = await request("/form_template_list", "GET");
        if (tplRes?.data) setTemplates(tplRes.data);

        // 3. Areas of Interest (NEW)
        const aoiRes = await request("/get_areas_of_interest", "GET");
        if (aoiRes?.status_code === 200 && Array.isArray(aoiRes.data)) {
            setAoiList(aoiRes.data);
        }

      } catch (err) {
        console.error("Setup fetch failed", err);
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  // ================= LOCATION SEARCH LOGIC =================
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (locationSearch.length >= 4) {
        setIsLocationLoading(true);
        try {
          const response = await fetch(`https://api.inditechit.com/get_city_suggestion/${locationSearch}`);
          const data = await response.json();
          setLocationSuggestions(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Location search failed", error);
        } finally {
          setIsLocationLoading(false);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [locationSearch]);

  const handleLocationSelect = (item: any) => {
    const formattedLocation = `${item.Location}, ${item.State}, ${item.Country}`;
    setFormData(prev => ({ ...prev, location: formattedLocation }));
    setIsLocationOpen(false);
    setLocationSearch("");
  };

  // ================= HELPERS =================
  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [id]: id === "budget" || id === "priorityLeads" ? Number(value) : value 
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTeamSelection = (team: string) => {
    setSelectedTeams(prev => 
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  // Generic Array Toggle for Lead Type, Capture Type, and AoI
  const toggleArrayItem = (field: "lead_type" | "capture_type" | "area_of_interest", value: string) => {
    setFormData((prev) => {
      const current = prev[field];
      const next = current.includes(value) ? current.filter(i => i !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const validateStep1 = () => {
    const required = ["eventName", "template_id", "location", "startDate", "endDate"];
    for (const key of required) {
      if (!formData[key as keyof typeof formData]) {
        toast({ variant: "destructive", title: "Missing Field", description: `${key} is required.` });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (selectedTeams.length === 0) return toast({ variant: "destructive", title: "Select a Team" });

    const payload = {
      event_owner: getEmail,
      event_name: formData.eventName,
      event_type: formData.eventType,
      event_status: formData.status,
      template_id: formData.template_id ? Number(formData.template_id) : null,
      location: formData.location,
      start_date: formData.startDate,
      end_date: formData.endDate,
      team: selectedTeams.join(", "), 
      budget: `${formData.currency} ${formData.budget || 0}`,
      event_size: formData.eventSize,
      priority_leads: Number(formData.priorityLeads) || 0,
      lead_type: formData.lead_type,
      capture_type: formData.capture_type,
      // Pass the array directly. The DB will store it as JSON [ "aoi1", "aoi2" ]
      area_of_interest: formData.area_of_interest, 
      total_leads: 0,
    };
    
    try {
      const res = await request("/create_events", "POST", payload);
      if (res?.message === "Event created successfully" || res?.success) {
        toast({ title: "✅ Event Created" });
        closeEventDialog();
        window.location.reload();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Submission failed" });
    }
  };

  const openEventDialog = () => {
    setIsOpen(true);
    setStep(1);
    setSelectedTeams([]);
    setFormData({
      eventName: "", eventType: "Tradeshow", template_id: "", status: "Upcoming",
      location: "", startDate: "", endDate: "", budget: 0, currency: "USD",
      eventSize: "medium", priorityLeads: 0, lead_type: [], capture_type: [], area_of_interest: []
    });
  };

  const closeEventDialog = () => setIsOpen(false);

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Event</DialogTitle>
            <span>Event Owner : {getEmail}</span>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={step === 1 ? 50 : 100} className="h-2" />
              <span className="text-xs text-muted-foreground font-medium">Step {step} of 2</span>
            </div>
          </DialogHeader>

          <div className="py-4">
            {step === 1 && (
              <div className="grid grid-cols-2 gap-5">
                {/* ... Step 1 Inputs remain the same ... */}
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Event Name *</Label>
                  <Input id="eventName" placeholder="Enter event name..." value={formData.eventName} onChange={handleChange} className="border-gray" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Region *</Label>
                  <Select value={formData.template_id} onValueChange={(v) => handleSelectChange("template_id", v)}>
                    <SelectTrigger className="border-gray"><SelectValue placeholder="Select Region" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((tpl: any) => (
                        <SelectItem key={tpl.id} value={String(tpl.id)}>{tpl.template_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Event Type *</Label>
                  <Select value={formData.eventType} onValueChange={(v) => handleSelectChange("eventType", v)}>
                    <SelectTrigger className="border-gray"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tradeshow">Tradeshow</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status *</Label>
                  <Select value={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
                    <SelectTrigger className="border-gray"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className=" space-y-2">
                    <Label className="text-sm font-semibold">Area of Interest</Label>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between border-gray font-normal">
                        {formData.area_of_interest.length > 0 
                            ? `${formData.area_of_interest.length} selected` 
                            : "Select Area of Interest..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                        <CommandInput placeholder="Search areas..." />
                        <CommandList>
                            <CommandEmpty>No area found.</CommandEmpty>
                            <CommandGroup className="max-h-48 overflow-auto">
                            {aoiList.map((area) => (
                                <CommandItem 
                                    key={area.id} 
                                    value={area.name}
                                    onSelect={() => toggleArrayItem("area_of_interest", area.name)}
                                >
                                <Check className={`mr-2 h-4 w-4 ${formData.area_of_interest.includes(area.name) ? "opacity-100" : "opacity-0"}`} />
                                {area.name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                    </Popover>
                    {/* Selected Badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                        {formData.area_of_interest.map((item) => (
                            <Badge 
                                key={item} 
                                variant="outline" 
                                className="cursor-pointer bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
                                onClick={() => toggleArrayItem("area_of_interest", item)}
                            >
                                {item} ×
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Location *</Label>
                  <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isLocationOpen}
                        className="w-full justify-between border-gray font-normal truncate"
                      >
                        {formData.location ? (
                          <span className="flex items-center gap-2 truncate">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            {formData.location}
                          </span>
                        ) : "Search city..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Type at least 4 letters..." 
                          value={locationSearch}
                          onValueChange={setLocationSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isLocationLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Searching...
                              </div>
                            ) : locationSearch.length < 4 ? (
                              "Please type 4 or more letters"
                            ) : (
                              "No results found."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {locationSuggestions.map((item) => (
                              <CommandItem
                                key={item.GeoNameId}
                                value={`${item.Location}-${item.GeoNameId}`}
                                onSelect={() => handleLocationSelect(item)}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.Location}</span>
                                  <span className="text-xs text-muted-foreground">{item.State}, {item.Country}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <DateInput label="Start Date" value={formData.startDate} required onChange={(v) => handleSelectChange("startDate", v)} />
                <DateInput label="End Date" value={formData.endDate} required onChange={(v) => handleSelectChange("endDate", v)} />
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-right-4">
                
                {/* 1. Teams Selection */}
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Select Team(s) *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between border-gray font-normal">
                        {selectedTeams.length > 0 ? `${selectedTeams.length} teams selected` : "Select teams..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search teams..." />
                        <CommandList>
                          <CommandGroup className="max-h-48 overflow-auto">
                            {teams.map((t) => (
                              <CommandItem key={t} onSelect={() => handleTeamSelection(t)}>
                                <Check className={`mr-2 h-4 w-4 ${selectedTeams.includes(t) ? "opacity-100" : "opacity-0"}`} />
                                {t}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTeams.map((t) => <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => handleTeamSelection(t)}>{t} ×</Badge>)}
                  </div>
                </div>

                {/* 3. Budget & Size */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Budget</Label>
                  <div className="flex gap-2">
                    <Select value={formData.currency} onValueChange={(v) => handleSelectChange("currency", v)}>
                      <SelectTrigger className="w-24 border-gray"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                    </Select>
                    <Input id="budget" type="number" value={formData.budget} onChange={handleChange} className="border-gray" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Event Size</Label>
                  <Select value={formData.eventSize} onValueChange={(v) => handleSelectChange("eventSize", v)}>
                    <SelectTrigger className="border-gray"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Priority Leads Target</Label>
                  <Input id="priorityLeads" type="number" value={formData.priorityLeads} onChange={handleChange} className="border-gray" />
                </div>

                <div className="col-span-2 border-t pt-4 space-y-3">
                  <Label className="text-sm font-bold">Lead Type *</Label>
                  <div className="flex gap-2">
                    {["Visiting Card", "Badge", "Manual"].map((type) => (
                      <Badge key={type} variant={formData.lead_type.includes(type) ? "default" : "outline"} className="cursor-pointer px-4 py-2 text-sm" onClick={() => toggleArrayItem("lead_type", type)}>
                        {type} {formData.lead_type.includes(type) && <Check className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 border-t pt-4 space-y-3">
                  <Label className="text-sm font-bold">Capture Type *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Booth Give Away", "Full Lead Form","Workshop"].map((label) => (
                      <div key={label} onClick={() => toggleArrayItem("capture_type", label)} className={`cursor-pointer border rounded-lg p-4 transition-all ${formData.capture_type.includes(label) ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-gray hover:bg-accent"}`}>
                        <div className="flex justify-between items-center text-sm font-semibold">
                          {label} {formData.capture_type.includes(label) && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between w-full border-t pt-4">
            {step === 2 && <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={closeEventDialog}>Cancel</Button>
              {step === 1 ? (
                <Button onClick={() => validateStep1() && setStep(2)}>
                  Next Step <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="px-8">Create Event</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EventDialogContext.Provider>
  );
}

export function useEventDialog() {
  const context = useContext(EventDialogContext);
  if (!context) throw new Error("useEventDialog must be used within an EventDialogProvider");
  return context;
}