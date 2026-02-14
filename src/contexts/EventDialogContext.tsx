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
import { 
  Check, 
  ChevronsUpDown, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  MapPin, 
  ShieldCheck 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EventOptInSelector } from "./EventOptInSelector"; // Ensure this path is correct

type EventDialogContextType = {
  openEventDialog: () => void;
  closeEventDialog: () => void;
};

const EventDialogContext = createContext<EventDialogContextType | undefined>(
  undefined
);

// --- CONSTANTS ---
const CAPTURE_TYPES = ["Booth Give Away", "Full Lead Form", "Workshop"];
const LEAD_TYPES = ["Visiting Card", "Badge", "Manual"];

export function EventDialogProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { request } = useApi<any>();

  // --- STATE MANAGEMENT ---
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // New: Opt-In Configuration (Step 3)
  const [optInConfig, setOptInConfig] = useState<any[]>([]);

  // Data Lists
  const [teams, setTeams] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [aoiList, setAoiList] = useState<any[]>([]);
  
  // Location Search State
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const getEmailLocal = localStorage.getItem("userDetails") || "";
const getEmail = getEmailLocal ? JSON.parse(getEmailLocal) : {};
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Form Data
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
    area_of_interest: [] as string[],
  });

  console.log(optInConfig, "Opt-In Config Debug");

  // ================= API DATA FETCHING =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Teams
        const teamRes = await request("/get_all_teams", "GET");
        if (teamRes?.length > 0) {
          // Filter out nulls and duplicates
          const names = Array.from(new Set(teamRes.map((t: any) => t.team_name).filter(Boolean)));
          setTeams(names as string[]);
        }
        
        // 2. Fetch Region/Templates
        const tplRes = await request("/form_template_list", "GET");
        if (tplRes?.data) setTemplates(tplRes.data);

        // 3. Fetch Areas of Interest
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

  // ================= FORM HANDLERS =================
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

  // Generic Select All / Deselect All
  const handleSelectAll = (field: "capture_type" | "area_of_interest", allItems: string[]) => {
    setFormData(prev => {
        const currentList = prev[field];
        const isAllSelected = currentList.length === allItems.length && allItems.length > 0;
        
        return {
            ...prev,
            [field]: isAllSelected ? [] : allItems
        };
    });
  };

  // ================= VALIDATION =================
  const validateStep1 = () => {
    const required = ["eventName", "template_id", "location", "startDate", "endDate"];
    const missing = required.filter(key => !formData[key as keyof typeof formData]);
    
    if (missing.length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Missing Fields", 
        description: `Please fill in: ${missing.join(', ')}` 
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedTeams.length === 0) {
        toast({ variant: "destructive", title: "Team Required", description: "Please select at least one team." });
        return false;
    }
    if (formData.lead_type.length === 0) {
        toast({ variant: "destructive", title: "Lead Type Required", description: "Select at least one lead type." });
        return false;
    }
    if (formData.capture_type.length === 0) {
        toast({ variant: "destructive", title: "Capture Type Required", description: "Select at least one capture method." });
        return false;
    }
    return true;
  };

  // ================= SUBMIT LOGIC =================
  const handleSubmit = async () => {
    setIsLoading(true);

    const payload = {
      event_owner: getEmail.user_name,
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
      area_of_interest: formData.area_of_interest, 
      total_leads: 0,
    };
    
    try {
      // 1. Create the Event
      const res = await request("/create_events", "POST", payload);
      
      // Check for various success responses depending on your API wrapper
      if (res?.success || res?.message === "Event created successfully") {
        
        // 2. Get the new Event ID
        const newEventId = res.id || res.data?.id || res.insertId;

        // 3. Save Opt-In Configuration (If any selected)
        if (newEventId && optInConfig.length > 0) {
            console.log(`Saving opt-ins for event ${newEventId}...`);
            await request(`/events/${newEventId}/optins`, "POST", { optIns: optInConfig });
        }

        toast({ title: "✅ Event Created Successfully" });
        closeEventDialog();
        window.location.reload();
      } else {
        toast({ 
            variant: "destructive", 
            title: "Creation Failed", 
            description: res?.message || "Unknown error occurred" 
        });
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast({ variant: "destructive", title: "Submission failed", description: "Check console for details." });
    } finally {
        setIsLoading(false);
    }
  };

  const openEventDialog = () => {
    setIsOpen(true);
    setStep(1);
    setSelectedTeams([]);
    setOptInConfig([]); // Reset Opt-Ins
    setFormData({
      eventName: "", eventType: "Tradeshow", template_id: "", status: "Upcoming",
      location: "", startDate: "", endDate: "", budget: 0, currency: "USD",
      eventSize: "medium", priorityLeads: 0, lead_type: [], capture_type: [], area_of_interest: []
    });
  };

  const closeEventDialog = () => setIsOpen(false);

  // --- Computed Helpers ---
  const allAoiNames = aoiList.map(a => a.name);
  const isAllAoiSelected = allAoiNames.length > 0 && formData.area_of_interest.length === allAoiNames.length;
  const isAllCaptureSelected = formData.capture_type.length === CAPTURE_TYPES.length;
  
  // Progress Bar Calculation
  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Event</DialogTitle>
            <div className="flex justify-between items-center pr-4">
                <span className="text-xs text-muted-foreground">Owner: {getEmail.user_name}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mt-4">
              <Progress value={progressValue} className="h-2 flex-1" />
              <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                Step {step} of 3
              </span>
            </div>
          </DialogHeader>

          <div className="py-6 min-h-[400px]">
            
            {/* ================= STEP 1: LOGISTICS ================= */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Event Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="eventName" 
                    placeholder="e.g. Global Tech Summit 2024" 
                    value={formData.eventName} 
                    onChange={handleChange} 
                    className="border-gray-200 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Region Template <span className="text-red-500">*</span></Label>
                  <Select value={formData.template_id} onValueChange={(v) => handleSelectChange("template_id", v)}>
                    <SelectTrigger className="border-gray-200"><SelectValue placeholder="Select Region" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((tpl: any) => (
                        <SelectItem key={tpl.id} value={String(tpl.id)}>{tpl.template_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Event Type <span className="text-red-500">*</span></Label>
                  <Select value={formData.eventType} onValueChange={(v) => handleSelectChange("eventType", v)}>
                    <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tradeshow">Tradeshow</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status <span className="text-red-500">*</span></Label>
                  <Select value={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
                    <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label className="text-sm font-semibold">Location <span className="text-red-500">*</span></Label>
                  <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between border-gray-200 font-normal truncate"
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
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Type 4+ letters..." 
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

                {/* 2. Area of Interest */}
                <div className="col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold">Area of Interest</Label>
                        {aoiList.length > 0 && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectAll("area_of_interest", allAoiNames)}
                                className="h-6 text-xs border-dashed px-2"
                            >
                                {isAllAoiSelected ? "Deselect All" : "Select All"}
                            </Button>
                        )}
                    </div>

                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between border-gray-200 font-normal">
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
                    
                    <div className="flex flex-wrap gap-1 mt-2 max-h-[60px] overflow-y-auto">
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

                {/* <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2"> */}
                    <DateInput 
                        label="Start Date" 
                        value={formData.startDate} 
                        required 
                        onChange={(v) => handleSelectChange("startDate", v)} 
                    />
                    <DateInput 
                        label="End Date" 
                        value={formData.endDate} 
                        required 
                        onChange={(v) => handleSelectChange("endDate", v)} 
                    />
                {/* </div> */}
              </div>
            )}

            {/* ================= STEP 2: TARGETING & DETAILS ================= */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* 1. Teams Selection */}
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Assign Team(s) <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between border-gray-200 font-normal">
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
                    {selectedTeams.map((t) => (
                        <Badge key={t} variant="secondary" className="cursor-pointer hover:bg-destructive/10" onClick={() => handleTeamSelection(t)}>
                            {t} ×
                        </Badge>
                    ))}
                  </div>
                </div>

                

                {/* 3. Budget & Size */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Budget</Label>
                  <div className="flex gap-2">
                    <Select value={formData.currency} onValueChange={(v) => handleSelectChange("currency", v)}>
                      <SelectTrigger className="w-24 border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                    </Select>
                    <Input id="budget" type="number" value={formData.budget} onChange={handleChange} className="border-gray-200" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Event Size</Label>
                  <Select value={formData.eventSize} onValueChange={(v) => handleSelectChange("eventSize", v)}>
                    <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (0-100)</SelectItem>
                      <SelectItem value="medium">Medium (100-500)</SelectItem>
                      <SelectItem value="large">Large (500+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Priority Leads Target</Label>
                  <Input id="priorityLeads" type="number" value={formData.priorityLeads} onChange={handleChange} className="border-gray-200" />
                </div>

                {/* 4. Lead Type */}
                <div className="col-span-2 border-t pt-4 space-y-3">
                  <Label className="text-sm font-bold">Lead Type <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    {LEAD_TYPES.map((type) => (
                      <Badge 
                        key={type} 
                        variant={formData.lead_type.includes(type) ? "default" : "outline"} 
                        className="cursor-pointer px-4 py-2 text-sm select-none" 
                        onClick={() => toggleArrayItem("lead_type", type)}
                      >
                        {type} {formData.lead_type.includes(type) && <Check className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 5. Capture Type */}
                <div className="col-span-2 border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold">Capture Type <span className="text-red-500">*</span></Label>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectAll("capture_type", CAPTURE_TYPES)}
                        className="h-6 text-xs border-dashed px-2"
                    >
                        {isAllCaptureSelected ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CAPTURE_TYPES.map((label) => (
                      <div 
                        key={label} 
                        onClick={() => toggleArrayItem("capture_type", label)} 
                        className={`cursor-pointer border rounded-lg p-4 transition-all select-none ${
                            formData.capture_type.includes(label) 
                            ? "border-primary bg-primary/10 ring-1 ring-primary" 
                            : "border-gray-200 hover:bg-accent"
                        }`}
                      >
                        <div className="flex justify-between items-center text-sm font-semibold">
                          {label} 
                          {formData.capture_type.includes(label) && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: COMPLIANCE & OPT-INS ================= */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                             <ShieldCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900">Compliance & Consent Configuration</h4>
                            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                Select the legal consent checkboxes (e.g., Marketing, GDPR) that will appear on the Lead Form for this event. 
                                Mark them as <strong>"Required"</strong> if the attendee must agree to proceed. 
                                If no boxes are selected, the lead form will appear without any custom consent checkboxes.
                            </p>
                        </div>
                    </div>

                    <div className="border-t pt-2">
                        {/* THE NEW OPT-IN SELECTOR COMPONENT */}
                        <EventOptInSelector 
                            value={optInConfig}
                            onChange={(val) => setOptInConfig(val)} 
                        />
                    </div>
                </div>
            )}

          </div>

          <DialogFooter className="flex justify-between w-full border-t pt-4 bg-background z-10">
            {step === 1 ? (
                 <Button variant="ghost" onClick={closeEventDialog}>Cancel</Button>
            ) : (
                 <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back
                 </Button>
            )}

            <div className="flex gap-2 ml-auto">
              {step < 3 ? (
                <Button onClick={() => {
                    if(step === 1 && validateStep1()) setStep(2);
                    if(step === 2 && validateStep2()) setStep(3);
                }}>
                  Next Step <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              ) : (
                <Button 
                    onClick={handleSubmit} 
                    className="px-8 bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                    disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Confirm & Create Event"
                  )}
                </Button>
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