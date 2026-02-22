import { useEffect, useState } from "react";
import { Search, Plus, X, Asterisk } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

// --- TYPES ---
type User = {
  employee_id: number;
  user_name: string;
};

// New Type for the User Details API response
type UserDetails = {
  employee_id: number;
  user_name: string;
  email: string;
  role?: string;
  profile?:string;
  // Add other fields returned by the API as needed
};

type AccessPointData = {
  page: string[];
  point: string[];
  user_id: number;
};

type TemplateType = "booth_give_away" | "full_lead_form" | "workshop";

// New Type for Field Selection
type FieldConfig = {
  key: string;
  required: boolean;
};

// --- CONSTANTS ---
const AVAILABLE_FIELDS = [
  "Name",
  "Designation",
  "Company",
  "Phone Numbers",
  "Emails",
  "Websites",
  "City",
  "State",
  "ZIP",
  "Country",
  "Area Of Interest",
  "Disclaimer",
  "Capture Data Consent",
  "Term And Condition",
  "Urgency",
  "Email Opt In",
  "(Email Consent) Signature", // Renamed for UI
];

// UPDATED: Helper to handle the specific mapping for Signature
const convertToApiKey = (label: string) => {
  // If the label is the UI-specific signature name, return the strict DB key "signature"
  if (label === "(Email Consent) Signature") {
    return "signature";
  }
  return label.toLowerCase().replace(/ /g, "_");
};

// Helper to create initial default objects
const createDefaultFields = (labels: string[]): FieldConfig[] => {
  return labels.map((label) => ({
    key: convertToApiKey(label),
    required: false, // Default to not required
  }));
};

const DEFAULT_CHECKED_LABELS = [
  "Name",
  "Designation",
  "Company",
  "Phone Numbers",
  "Emails",
  "Websites",
  "City",
  "State",
  "ZIP",
];

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

  // 🔹 NEW STATE: Store Current User Details
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

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

  const [activeTab, setActiveTab] = useState<TemplateType>("booth_give_away");

  // UPDATED STATE: Stores objects instead of strings
  const [fieldSelections, setFieldSelections] = useState<
    Record<TemplateType, FieldConfig[]>
  >({
    booth_give_away: createDefaultFields(DEFAULT_CHECKED_LABELS),
    full_lead_form: createDefaultFields(DEFAULT_CHECKED_LABELS),
    workshop: createDefaultFields(DEFAULT_CHECKED_LABELS),
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

  // 🔹 FETCH USER DETAILS INTEGRATION
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!getEmail) return;

      try {
        // You can use the 'request' hook if it supports full URLs, otherwise standard fetch works here
        const token = localStorage.getItem("token"); // Assuming you store token
        const response = await fetch(
          `https://api.inditechit.com/get_user_details?email=${getEmail}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Add Authorization if your API requires it
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          // Assuming result.data contains the user object based on standard API patterns
          if (result && result.data) {
            setUserDetails(result.data);
            localStorage.setItem("userDetails",JSON.stringify(result.data))
          }
        } else {
          console.error("Failed to fetch user details:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, [getEmail]);

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
          const pageName =
            page.replace("/", "").replace(/\/+$/, "") || "dashboard";
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
  }, [teamDialogOpen]);

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

  // 2. TOGGLE FIELD SELECTION
  const toggleField = (label: string) => {
    const api = convertToApiKey(label);
    const emailOptInKey = convertToApiKey("Email Opt In");
    const signatureKey = convertToApiKey("(Email Consent) Signature"); // Returns "signature"

    setFieldSelections((prev) => {
      const currentList = prev[activeTab];
      const exists = currentList.find((f) => f.key === api);

      let newList;
      if (exists) {
        // Remove
        newList = currentList.filter((f) => f.key !== api);

        // Logic: If user unselects 'email_opt_in', also unselect 'signature'
        if (api === emailOptInKey) {
          newList = newList.filter((f) => f.key !== signatureKey);
        }
      } else {
        // Add (default not required)
        newList = [...currentList, { key: api, required: false }];
      }

      return { ...prev, [activeTab]: newList };
    });
  };

  // 3. TOGGLE REQUIRED STATUS
  const toggleRequired = (label: string) => {
    const api = convertToApiKey(label);

    setFieldSelections((prev) => {
      const currentList = prev[activeTab];
      const newList = currentList.map((f) =>
        f.key === api ? { ...f, required: !f.required } : f
      );

      return { ...prev, [activeTab]: newList };
    });
  };

  // 4. BUILD PAYLOAD
  const buildFieldsPayload = () => {
    let combinedFields: any[] = [];

    (Object.keys(fieldSelections) as TemplateType[]).forEach((type) => {
      const fieldsForType = fieldSelections[type];

      const mappedFields = fieldsForType.map((field) => ({
        field_name: field.key,
        field_type: type,
        is_required: field.required, // Pass the boolean to API
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
      fields: buildFieldsPayload(),
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

        setTemplateDialogOpen(false);
        setTemplateName("");
        setTemplateDescription("");
        setTemplateLogoBase64("");
        setFieldSelections({
          booth_give_away: createDefaultFields(DEFAULT_CHECKED_LABELS),
          full_lead_form: createDefaultFields(DEFAULT_CHECKED_LABELS),
          workshop: createDefaultFields(DEFAULT_CHECKED_LABELS),
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

  // ... Team Creation Handlers (unchanged) ...
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
      toast({
        title: "Team Created",
        description: "Team created successfully.",
      });
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

  // 5. UPDATED COMPONENT: Field Checkboxes with Required Toggle
  const FieldCheckboxes = () => {
    const currentSelectedList = fieldSelections[activeTab];
    const allKeys = AVAILABLE_FIELDS.map(convertToApiKey);
    const isAllSelected = currentSelectedList.length === allKeys.length;

    // Check if Email Opt In is currently selected for this tab
    const emailOptInKey = convertToApiKey("Email Opt In");
    const signatureKey = convertToApiKey("(Email Consent) Signature"); // "signature"

    const isEmailOptInSelected = currentSelectedList.some(
      (f) => f.key === emailOptInKey
    );

    const handleSelectAll = () => {
      setFieldSelections((prev) => ({
        ...prev,
        [activeTab]: isAllSelected
          ? []
          : allKeys.map((k) => ({ key: k, required: false })),
      }));
    };

    return (
      <div className="space-y-2 mt-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="h-8 text-xs border-dashed"
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
          {AVAILABLE_FIELDS.map((label) => {
            const api = convertToApiKey(label);

            // Logic: If this field is Signature, and Email Opt In is NOT selected, skip rendering it
            if (api === signatureKey && !isEmailOptInSelected) {
              return null;
            }

            const fieldConfig = currentSelectedList.find((f) => f.key === api);
            const isChecked = !!fieldConfig;
            const isRequired = fieldConfig?.required || false;

            return (
              <div
                key={label}
                className={`flex items-center justify-between border p-2 rounded transition-colors text-sm ${
                  isChecked
                    ? "bg-primary/5 border-primary"
                    : "hover:bg-muted border-input"
                }`}
              >
                {/* Left Side: Checkbox & Label */}
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleField(label)}
                    className="w-4 h-4 rounded border-gray-300 accent-primary focus:ring-primary"
                  />
                  <span className="select-none truncate font-medium">
                    {label}
                  </span>
                </label>

                {/* Right Side: Required Switch */}
                {isChecked && (
                  <div className="flex items-center gap-1.5 border-l pl-2 ml-2">
                    <span
                      className={`text-[10px] uppercase font-bold ${
                        isRequired ? "text-red-500" : "text-muted-foreground"
                      }`}
                    >
                      {isRequired ? "Req" : "Opt"}
                    </span>
                    <Switch
                      checked={isRequired}
                      onCheckedChange={() => toggleRequired(label)}
                      className="scale-75"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
        <div className="flex items-center space-x-4">
          {/* 🔹 UPDATED: Shows User Name from API if available */}
          <h2 className="text-lg font-semibold text-foreground">
            Eprevent Admin
          </h2>
          <span className="ml-2 text-sm text-muted-foreground hidden sm:inline-block">
            Login As : {userDetails?.user_name
              ? `${userDetails.user_name} (${userDetails.profile})`
              : ""}
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
          {/* ... Team Dialog Content (Same as before) ... */}
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
                  const emp = users?.find((u) => String(u.employee_id) === id);
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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

                <TabsContent
                  value="booth_give_away"
                  className="border rounded-md p-4 bg-slate-50/50"
                >
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Select fields for Booth Give Away
                    </h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-white">
                        {fieldSelections.booth_give_away.length} Selected
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-white text-red-600 border-red-200"
                      >
                        {
                          fieldSelections.booth_give_away.filter(
                            (f) => f.required
                          ).length
                        }{" "}
                        Required
                      </Badge>
                    </div>
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
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-white">
                        {fieldSelections.full_lead_form.length} Selected
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-white text-red-600 border-red-200"
                      >
                        {
                          fieldSelections.full_lead_form.filter(
                            (f) => f.required
                          ).length
                        }{" "}
                        Required
                      </Badge>
                    </div>
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
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-white">
                        {fieldSelections.workshop.length} Selected
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-white text-red-600 border-red-200"
                      >
                        {
                          fieldSelections.workshop.filter((f) => f.required)
                            .length
                        }{" "}
                        Required
                      </Badge>
                    </div>
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