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
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronsUpDown, 
  Edit, 
  Loader2, 
  MapPin, 
  Search, 
  X,
  Calendar
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { DateInput } from "@/components/ui/DateInput";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// ================= INTERFACES =================
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
  lead_type?: string[];
  event_type?: string;
  area_of_interest?: any; 
}

interface AccessPointData {
  page: string[];
  point: string[];
  user_id: number;
}

// ================= CONSTANTS =================
const CAPTURE_OPTIONS = [
  { id: "booth", label: "Booth Give Away", desc: "Gamified entry" },
  { id: "full", label: "Full Lead Form", desc: "Detailed data entry" },
  { id: "workshop", label: "Workshop", desc: "Workshop" },
];

const LEAD_TYPES = ["Visiting Card", "Badge", "Manual"];

// ================= UPDATE POPUP COMPONENT =================
function UpdateEventPopup({
  event,
  onClose,
  onSave,
}: {
  event: Event | null;
  onClose: () => void;
  onSave: (updatedEvent: Event) => void;
}) {
  const [step, setStep] = useState(1);
  const { request, loading } = useApi<any>();
  const { toast } = useToast();

  // 🔹 DATA STATES
  const [teams, setTeams] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [aoiList, setAoiList] = useState<any[]>([]); // API list of AOIs
  
  // 🔹 LOCATION SEARCH STATES
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  // 🔹 INITIALIZE STATE DIRECTLY
  const [selectedTeams, setSelectedTeams] = useState<string[]>(() => {
    return event?.team ? event.team.split(", ").filter(Boolean) : [];
  });

  const [formData, setFormData] = useState(() => {
    if (!event) {
      return {
        event_id: 0,
        event_name: "",
        event_status: "Upcoming",
        event_type: "Tradeshow",
        template_id: "",
        location: "",
        start_date: "",
        end_date: "",
        area_of_interest: [] as string[],
        budget_value: 0,
        currency: "USD",
        event_size: "medium",
        priority_leads: 0,
        lead_type: [] as string[],
        capture_type: [] as string[],
      };
    }

    // 1. Parse Budget
    let bValue = 0;
    let bCurrency = "USD";
    if (event.budget) {
      const parts = event.budget.split(" ");
      if (parts.length === 2) {
        bCurrency = parts[0];
        bValue = Number(parts[1]) || 0;
      } else {
        bValue = Number(event.budget) || 0;
      }
    }

    // 2. Parse Arrays (ROBUST PARSER FIX)
    const parseArray = (val: any): string[] => {
      if (!val) return [];
      
      let parsed = val;
      
      // If string, try to JSON parse it
      if (typeof val === 'string') {
        try {
          parsed = JSON.parse(val);
        } catch {
          return [];
        }
      }

      // Ensure it is an array
      if (!Array.isArray(parsed)) return [];

      // ✅ FIX: Map Objects ({id, label}) to Strings ("label")
      return parsed.map((item: any) => {
        if (typeof item === 'object' && item !== null && 'label' in item) {
          return item.label; // Extract the name/label
        }
        return String(item); // Ensure it's a string
      });
    };

    return {
      event_id: event.event_id,
      event_name: event.event_name,
      event_status: event.event_status,
      event_type: event.event_type || "Tradeshow",
      template_id: event.template_id ? String(event.template_id) : "",
      location: event.location,
      start_date: event.start_date || "",
      end_date: event.end_date || "",
      budget_value: bValue,
      currency: bCurrency,
      event_size: event.event_size || "medium",
      priority_leads: event.priority_leads || 0,
      lead_type: parseArray(event.lead_type),
      capture_type: parseArray(event.capture_type),
      area_of_interest: parseArray(event.area_of_interest),
    };
  });

  // 🔹 FETCH API DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Teams
        const teamRes = await request("/get_all_teams", "GET");
        if (Array.isArray(teamRes)) {
          setTeams(teamRes.map((t: any) => t.team_name).filter(Boolean));
        }
        // Templates
        const tplRes = await request("/form_template_list", "GET");
        if (tplRes?.data) setTemplates(tplRes.data);

        // Areas of Interest
        const aoiRes = await request("/get_areas_of_interest", "GET");
        if (aoiRes?.status_code === 200 && Array.isArray(aoiRes.data)) {
            setAoiList(aoiRes.data);
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  // 🔹 DEBOUNCED LOCATION SEARCH
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (locationSearch.length >= 4) {
        setIsLocationLoading(true);
        try {
          const res = await fetch(`https://api.inditechit.com/get_city_suggestion/${locationSearch}`);
          const data = await res.json();
          setLocationSuggestions(Array.isArray(data) ? data : []);
        } catch { 
          setLocationSuggestions([]); 
        } finally { 
          setIsLocationLoading(false); 
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [locationSearch]);

  // 🔹 HANDLERS
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "lead_type" | "capture_type" | "area_of_interest", value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const next = current.includes(value) ? current.filter(i => i !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  // ✅ NEW: Handle Select All / Deselect All
  const handleSelectAll = (field: "capture_type" | "area_of_interest", allItems: string[]) => {
    setFormData(prev => {
      const currentList = prev[field];
      const isAllSelected = currentList.length === allItems.length && allItems.length > 0;
      return { ...prev, [field]: isAllSelected ? [] : allItems };
    });
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      budget: `${formData.currency} ${formData.budget_value}`,
      team: selectedTeams.join(", "),
      template_id: formData.template_id ? Number(formData.template_id) : null,
      priority_leads: Number(formData.priority_leads)
    };

    try {
      const res = await request(`/update_event?event_id=${formData.event_id}`, "PUT", payload);
      if (res) {
        toast({ title: "Event Updated Successfully" });
        onSave({ ...event, ...payload } as Event);
        onClose();
      }
    } catch (err) { 
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    }
  };

  // 🔹 CALCULATED STATES FOR SELECT ALL
  const allAoiNames = aoiList.map(a => a.name);
  const isAllAoiSelected = allAoiNames.length > 0 && formData.area_of_interest.length === allAoiNames.length;
  
  const allCaptureLabels = CAPTURE_OPTIONS.map(c => c.label);
  const isAllCaptureSelected = formData.capture_type.length === allCaptureLabels.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Update Event</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <Progress value={step === 1 ? 50 : 100} className="h-2 flex-1" />
          <span className="text-sm font-semibold whitespace-nowrap">Step {step} of 2</span>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-right-4">
              
              <div className="col-span-2">
                <Label>Event Name *</Label>
                <Input value={formData.event_name} onChange={(e) => handleChange("event_name", e.target.value)} className="border-gray" />
              </div>

              <div>
                <Label>Lead Capture Template *</Label>
                <Select value={formData.template_id} onValueChange={(v) => handleChange("template_id", v)}>
                  <SelectTrigger className="border-gray"><SelectValue placeholder="Select Template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((tpl: any) => <SelectItem key={tpl.id} value={String(tpl.id)}>{tpl.template_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Event Type *</Label>
                <Select value={formData.event_type} onValueChange={(v) => handleChange("event_type", v)}>
                  <SelectTrigger className="border-gray"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tradeshow">Tradeshow</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status *</Label>
                <Select value={formData.event_status} onValueChange={(v) => handleChange("event_status", v)}>
                  <SelectTrigger className="border-gray"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 md:col-span-1">
                 {/* SEARCHABLE LOCATION */}
                <Label>Location *</Label>
                <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between border-gray font-normal">
                      {formData.location ? <span className="truncate">{formData.location}</span> : "Search city..."}
                      <MapPin className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Type 4+ characters..." value={locationSearch} onValueChange={setLocationSearch} />
                      <CommandList>
                        <CommandEmpty>
                           {isLocationLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Searching...</span> : "No results found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {locationSuggestions.map((item) => (
                            <CommandItem key={item.GeoNameId} onSelect={() => {
                              handleChange("location", `${item.Location}, ${item.State}, ${item.Country}`);
                              setIsLocationOpen(false);
                            }}>
                              <div className="flex flex-col">
                                <span>{item.Location}</span>
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

              {/* ✅ AREA OF INTEREST (Multi-Select) */}
              <div className="col-span-2 ">
                <div className="flex justify-between items-center mb-1">
                    <Label>Area of Interest</Label>
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
                        <Button variant="outline" className="w-full justify-between border-gray font-normal">
                        {formData.area_of_interest.length > 0 
                            ? `${formData.area_of_interest.length} selected` 
                            : "Select Area of Interest..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
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

              <DateInput label="Start Date" value={formData.start_date} required onChange={(v) => handleChange("start_date", v)} />
              <DateInput label="End Date" value={formData.end_date} required onChange={(v) => handleChange("end_date", v)} />
            </div>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-right-4">
              
              <div className="col-span-2">
                <Label>Select Team(s) *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between border-gray font-normal">
                      {selectedTeams.length > 0 ? `${selectedTeams.length} teams selected` : "Select teams..."}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search teams..." />
                      <CommandList>
                        <CommandGroup className="max-h-48 overflow-auto">
                          {teams.map((t) => (
                            <CommandItem key={t} onSelect={() => setSelectedTeams(prev => prev.includes(t) ? prev.filter(i => i !== t) : [...prev, t])}>
                              <Check className={`mr-2 h-4 w-4 ${selectedTeams.includes(t) ? "opacity-100" : "opacity-0"}`} /> {t}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTeams.map((t) => (
                    <Badge key={t} variant="secondary" className="cursor-pointer hover:bg-destructive/10 hover:text-destructive" onClick={() => setSelectedTeams(prev => prev.filter(i => i !== t))}>
                      {t} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Budget</Label>
                <div className="flex gap-2">
                  <Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}>
                    <SelectTrigger className="w-24 border-gray"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                  </Select>
                  <Input type="number" value={formData.budget_value} onChange={(e) => handleChange("budget_value", e.target.value)} className="border-gray" />
                </div>
              </div>

              <div>
                <Label>Event Size</Label>
                <Select value={formData.event_size} onValueChange={(v) => handleChange("event_size", v)}>
                  <SelectTrigger className="border-gray"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Priority Leads Target</Label>
                <Input type="number" value={formData.priority_leads} onChange={(e) => handleChange("priority_leads", e.target.value)} className="border-gray" />
              </div>

              {/* LEAD TYPE */}
              <div className="col-span-2 border-t pt-4">
                <Label className="font-bold mb-2 block text-sm">Lead Type *</Label>
                <div className="flex gap-2">
                  {LEAD_TYPES.map((type) => (
                    <Badge key={type} variant={formData.lead_type.includes(type) ? "default" : "outline"} className="cursor-pointer px-4 py-2" onClick={() => toggleArrayItem("lead_type", type)}>
                      {type} {formData.lead_type.includes(type) && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* ✅ CAPTURE TYPE */}
              <div className="col-span-2 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                    <Label className="font-bold block text-sm">Capture Type *</Label>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectAll("capture_type", allCaptureLabels)}
                        className="h-6 text-xs border-dashed px-2"
                    >
                        {isAllCaptureSelected ? "Deselect All" : "Select All"}
                    </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    {CAPTURE_OPTIONS.map(({ label, desc }) => (
                      <div
                        key={label}
                        onClick={() => toggleArrayItem("capture_type", label)}
                        className={`
                          cursor-pointer border rounded-lg p-3 transition-all
                          ${formData.capture_type.includes(label) 
                            ? "border-primary bg-primary/10 ring-1 ring-primary" 
                            : "hover:bg-accent border-gray"}
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

        {/* FOOTER */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          {step === 1 ? (
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
          )}
          
          <div className="flex gap-2">
            {step === 1 ? (
              <Button onClick={() => setStep(2)}>Next Step <ArrowRight className="ml-2 h-4 w-4"/></Button>
            ) : (
              <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Update Event"}</Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ================= HELPERS =================
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

// ================= MAIN EVENTS PAGE =================
export default function Events() {
  const { request, loading, error } = useApi<Event[]>();
  const [events, setEvents] = useState<Event[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 🔹 FILTER STATES
  const [status, setStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("All");

  // 🔹 DATA STATES
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

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

        // Fetch Templates
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

  // 🔹 FETCH EVENTS
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
          setEvents(data?.data || []);
        } else {
          const response = await fetch(`https://api.inditechit.com/get_user_team_events?id=${currentUserId}`);
          const result = await response.json();
          setEvents(result?.data || []);
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
      setSelectedTemplateId("All");
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
                      <th className="py-3 px-4 text-left">Event Name & Dates</th>
                      {/* <th className="py-3 px-4 text-left">Dates</th> */}
                      <th className="py-3 px-4 text-left">Location</th>
                      <th className="py-3 px-4 text-left">Team</th>
                      <th className="py-3 px-4 text-left">Event Type</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
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
                          <td className="py-3 px-4">{event.event_name} <br/><span className="text-xs">({event.start_date} → {event.end_date})</span></td>
                          {/* <td className="py-3 px-4">
                            {event.start_date} → {event.end_date}
                          </td> */}
                          <td className="py-3 px-4">{event.location}</td>
                          <td className="py-3 px-4">{event.team}</td>
                          <td className="py-3 px-4">{event.event_type}</td>
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