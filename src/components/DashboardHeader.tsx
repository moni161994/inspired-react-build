import { useEffect, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { logout } from "@/hooks/auth";
import { useEventDialog } from "@/contexts/EventDialogContext";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// --- TYPES ---
type User = {
  employee_id: number;
  user_name: string;
};

type AccessPointData = {
  page: string[];
  point: string[];
  user_id: number;
};

// Define valid template types explicitly
type TemplateType = "booth_give_away" | "full_lead_form" | "workshop";

// --- CONSTANTS ---
const AVAILABLE_FIELDS = [
  "Name",
  "Designation",
  "Company",
  "Phone Numbers",
  "Emails",
  "Websites",
  "Other",
  "City",
  "State",
  "ZIP",
  "Country",
  "Area Of Interest",
  "Disclaimer",
  "Consent Form",
  "Term And Condition",
  "Signature",
  "Email Opt In",
];

// Helper to sanitize labels for API keys
const convertToApiKey = (label: string) =>
  label.toLowerCase().replace(/ /g, "_");

// Default fields checked when creating a new template
const DEFAULT_CHECKED_LABELS = [
  "Name",
  "Designation",
  "Company",
  "Phone Numbers",
  "Emails",
  "Websites",
  "Other",
  "City",
  "State",
  "ZIP",
];

const DEFAULT_CHECKED_KEYS = DEFAULT_CHECKED_LABELS.map(convertToApiKey);

export function DashboardHeader() {
  const navigate = useNavigate();
  const { openEventDialog } = useEventDialog();
  const { request } = useApi();
  const { toast } = useToast();

  // --- STATE ---
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Team Form Data
  const [formData, setFormData] = useState({
    team_name: "",
    manager_id: "",
    employees_id: [] as string[],
  });

  // Template Form Data
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateLogoBase64, setTemplateLogoBase64] = useState<string>("");

  // 1. STATE FOR TABS & INDEPENDENT SELECTIONS
  const [activeTab, setActiveTab] = useState<TemplateType>("booth_give_away");

  // Stores selections separately for each tab type
  const [fieldSelections, setFieldSelections] = useState<Record<TemplateType, string[]>>({
    booth_give_away: [...DEFAULT_CHECKED_KEYS],
    full_lead_form: [...DEFAULT_CHECKED_KEYS],
    workshop: [...DEFAULT_CHECKED_KEYS],
  });

  // Access Control State
  const [access, setAccess] = useState<AccessPointData | null>(null);
  const [canCreateTeam, setCanCreateTeam] = useState(false);
  const [canCreateTemplate, setCanCreateTemplate] = useState(false);
  const [canCreateEvent, setCanCreateEvent] = useState(false);

  // --- HELPERS ---
  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };

  const getEmail = localStorage.getItem("email") || "";

  // --- API / LOADERS ---
  const loadAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const res = await request(`/get_single_access/${userId}`, "GET");
      if (res?.status_code === 200 && res.data) {
        const parsed: AccessPointData = {
          page: JSON.parse(res.data.page),
          point: JSON.parse(res.data.point),
          user_id: Number(res.data.user_id),
        };
        setAccess(parsed);

        const hasPage = (p: string) => parsed.page.includes(p);
        const hasAction = (page: string, action: string) => {
          const pageName = page.replace("/", "").replace(/\/+$/, "") || "dashboard";
          const suffix = `${action}_${pageName}`;
          return parsed.point.includes(suffix);
        };

        setCanCreateTeam(hasPage("/team") && hasAction("/team", "add_team"));
        setCanCreateTemplate(
          hasPage("/template") && hasAction("/template", "create_template")
        );
        setCanCreateEvent(
          hasPage("/events") && hasAction("/events", "create_event")
        );
      }
    } catch (e) {
      console.error("access fetch error", e);
      setCanCreateTeam(false);
      setCanCreateTemplate(false);
      setCanCreateEvent(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await request("/get_users", "GET");
        if (Array.isArray(res?.data)) {
          setUsers(res?.data);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
    loadAccess();
  }, [teamDialogOpen]); // Refresh users when team dialog opens/closes context

  // --- HANDLERS ---
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTemplateLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 2. TOGGLE LOGIC: Updates only the active tab's list
  const toggleField = (label: string) => {
    const api = convertToApiKey(label);

    setFieldSelections((prev) => {
      const currentList = prev[activeTab]; // Get list for currently active tab
      const newList = currentList.includes(api)
        ? currentList.filter((f) => f !== api)
        : [...currentList, api];

      return {
        ...prev,
        [activeTab]: newList, // Update only active tab in state
      };
    });
  };

  // 3. BUILD PAYLOAD: Flattens all 3 tabs into one array
  const buildFieldsPayload = () => {
    let combinedFields: any[] = [];

    (Object.keys(fieldSelections) as TemplateType[]).forEach((type) => {
      const fieldsForType = fieldSelections[type];

      const mappedFields = fieldsForType.map((field_name) => ({
        field_name,
        field_type: type, // e.g. "booth_give_away", "workshop"
        is_required: false,
      }));

      combinedFields = [...combinedFields, ...mappedFields];
    });

    return combinedFields;
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Name",
        description: "Template name is required.",
      });
      return;
    }

    // Optional: Validate that at least one field is selected in total
    const totalSelected = Object.values(fieldSelections).flat().length;
    if (totalSelected === 0) {
      toast({
        variant: "destructive",
        title: "No Fields",
        description: "Please select at least one field in one of the tabs.",
      });
      return;
    }

    if (!canCreateTemplate) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You are not allowed to create templates.",
      });
      return;
    }

    setLoading(true);

    const payload = {
      templateName: templateName,
      description: templateDescription,
      fields: buildFieldsPayload(), // Send combined data
      template_image_base64: templateLogoBase64,
    };

    try {
      const res = await request("/create_form_template", "POST", payload);

      if (
        res?.success ||
        res?.message?.toLowerCase()?.includes("created") ||
        res?.msg?.toLowerCase()?.includes("created")
      ) {
        toast({
          title: "Template Created",
          description: "Your new template has been added successfully.",
        });

        // Reset Form
        setTemplateDialogOpen(false);
        setTemplateName("");
        setTemplateDescription("");
        setTemplateLogoBase64("");
        setFieldSelections({
          booth_give_away: [...DEFAULT_CHECKED_KEYS],
          full_lead_form: [...DEFAULT_CHECKED_KEYS],
          workshop: [...DEFAULT_CHECKED_KEYS],
        });

        window.location.href = "/template";
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: res?.message || res?.msg || "Unexpected error.",
        });
      }
    } catch (err: any) {
      console.error("create template error:", err);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not create template. Try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Team Creation Handlers
  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const toggleEmployee = (id: string) => {
    setFormData((prev) => {
      const exists = prev.employees_id.includes(id);
      const updated = exists
        ? prev.employees_id.filter((emp) => emp !== id)
        : [...prev.employees_id, id];
      return { ...prev, employees_id: updated };
    });
  };

  const handleCreateTeam = async () => {
    if (!canCreateTeam) {
      toast({ variant: "destructive", title: "Permission Denied" });
      return;
    }
    const { team_name, manager_id, employees_id } = formData;
    if (!team_name || !manager_id || employees_id?.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill all required team fields.",
      });
      return;
    }

    setLoading(true);
    const res = await request("/create_team", "POST", {
      team_name,
      manager_id,
      employees_id,
    });
    setLoading(false);

    if (res?.message === "Team created successfully") {
      toast({ title: "Team Created", description: "Team created successfully." });
      setTeamDialogOpen(false);
      setFormData({ team_name: "", manager_id: "", employees_id: [] });
      window.location.href = "/team";
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: res?.msg || "Error creating team.",
      });
    }
  };

  // 4. COMPONENT: Field Checkboxes (Renders checkboxes for current Active Tab)
  const FieldCheckboxes = () => {
    const currentSelectedList = fieldSelections[activeTab];

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
        {AVAILABLE_FIELDS.map((label) => {
          const api = convertToApiKey(label);
          const isChecked = currentSelectedList.includes(api);

          return (
            <label
              key={label}
              className={`flex items-center gap-2 border p-2 rounded cursor-pointer transition-colors text-sm ${
                isChecked
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-muted border-input"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleField(label)}
                className="w-4 h-4 rounded border-gray-300 accent-primary focus:ring-primary"
              />
              <span className="select-none truncate">{label}</span>
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">
            Eprevent Admin
          </h2>{" "}
          <span className="ml-2 text-sm text-muted-foreground hidden sm:inline-block">
            Login As ({getEmail})
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {canCreateTemplate && (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setTemplateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Create Template</span>
              <span className="sm:hidden">Template</span>
            </Button>
          )}

          {canCreateEvent && (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={openEventDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add New Event</span>
              <span className="sm:hidden">Event</span>
            </Button>
          )}

          <Button variant="outline" onClick={handleLogout}>
            LogOut
          </Button>
        </div>
      </header>

      {/* --- TEAM DIALOG --- */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Team</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="team_name">Team Name *</Label>
              <Input
                className="border-gray-300 focus:border-primary"
                id="team_name"
                placeholder="Enter team name"
                value={formData.team_name}
                onChange={handleTeamChange}
              />
            </div>

            <div>
              <Label>Manager *</Label>
              <Select
                value={formData.manager_id}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, manager_id: val }))
                }
              >
                <SelectTrigger className="border-gray-300 focus:border-primary">
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem
                      key={user.employee_id}
                      value={String(user.employee_id)}
                    >
                      {user.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Employees *</Label>
              <Command className="border rounded-md border-gray-300">
                <CommandInput placeholder="Search employees..." />
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {users?.map((user) => (
                    <CommandItem
                      key={user.employee_id}
                      onSelect={() => toggleEmployee(String(user.employee_id))}
                    >
                      <div
                        className={`flex items-center justify-between w-full ${
                          formData.employees_id.includes(
                            String(user.employee_id)
                          )
                            ? "font-semibold text-primary"
                            : ""
                        }`}
                      >
                        <span>{user.user_name}</span>
                        {formData.employees_id.includes(
                          String(user.employee_id)
                        ) && <X className="w-4 h-4" />}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData?.employees_id?.map((id) => {
                  const emp = users?.find(
                    (u) => String(u.employee_id) === id
                  );
                  return (
                    <Badge
                      key={id}
                      className="flex items-center space-x-1 pl-2 pr-1 py-1"
                      variant="secondary"
                    >
                      <span>{emp?.user_name || `User ${id}`}</span>
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => toggleEmployee(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- TEMPLATE DIALOG --- */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Top Row: Name & Logo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Template Name *</Label>
                <Input
                  className="border-gray-300 focus:border-primary mt-1.5"
                  placeholder="Enter template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div>
                <Label>Brand Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="border-gray-300 focus:border-primary mt-1.5 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                className="border-gray-300 focus:border-primary mt-1.5"
                placeholder="Enter description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>

            {/* TABS SECTION */}
            <div className="mt-6 border-t pt-4">
              <Label className="text-base font-semibold mb-4 block">
                Configure Fields per Type
              </Label>

              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as TemplateType)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="booth_give_away">
                    Booth Give Away
                  </TabsTrigger>
                  <TabsTrigger value="full_lead_form">
                    Full Lead Form
                  </TabsTrigger>
                  <TabsTrigger value="workshop">Workshop</TabsTrigger>
                </TabsList>

                {/* Tab Contents: Reusing FieldCheckboxes Component */}
                <TabsContent
                  value="booth_give_away"
                  className="border rounded-md p-4 bg-slate-50/50"
                >
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Select fields for Booth Give Away
                    </h4>
                    <Badge variant="outline" className="bg-white">
                      {fieldSelections.booth_give_away.length} Selected
                    </Badge>
                  </div>
                  <FieldCheckboxes />
                </TabsContent>

                <TabsContent
                  value="full_lead_form"
                  className="border rounded-md p-4 bg-slate-50/50"
                >
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Select fields for Full Lead Form
                    </h4>
                    <Badge variant="outline" className="bg-white">
                      {fieldSelections.full_lead_form.length} Selected
                    </Badge>
                  </div>
                  <FieldCheckboxes />
                </TabsContent>

                <TabsContent
                  value="workshop"
                  className="border rounded-md p-4 bg-slate-50/50"
                >
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Select fields for Workshop
                    </h4>
                    <Badge variant="outline" className="bg-white">
                      {fieldSelections.workshop.length} Selected
                    </Badge>
                  </div>
                  <FieldCheckboxes />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={loading}>
              {loading ? "Saving Template..." : "Save Template (All Types)"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}