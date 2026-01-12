import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
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
import { X } from "lucide-react";

type User = {
  employee_id: number;
  user_name: string;
};

type AccessPointData = {
  page: string[];
  point: string[];
  user_id: number;
};

const AVAILABLE_FIELDS = [
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

const convertToApiKey = (label: string) =>
  label.toLowerCase().replace(/ /g, "_");

export function DashboardHeader() {
  const navigate = useNavigate();
  const { openEventDialog } = useEventDialog();
  const { request } = useApi();
  const { toast } = useToast();

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    team_name: "",
    manager_id: "",
    employees_id: [] as string[],
  });

  // CREATE TEMPLATE STATES
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [templateLogoBase64, setTemplateLogoBase64] = useState<string>("");

  // ACCESS STATES
  const [access, setAccess] = useState<AccessPointData | null>(null);
  const [canCreateTeam, setCanCreateTeam] = useState(false);
  const [canCreateTemplate, setCanCreateTemplate] = useState(false);
  const [canCreateEvent, setCanCreateEvent] = useState(false);

  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };

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

        // /team + add_team
        setCanCreateTeam(hasPage("/team") && hasAction("/team", "add_team"));
        // /template + create_template
        setCanCreateTemplate(
          hasPage("/template") && hasAction("/template", "create_template")
        );
        // /events + create_event
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTemplateLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleField = (label: string) => {
    const api = convertToApiKey(label);
    setSelectedFields((prev) =>
      prev.includes(api) ? prev.filter((f) => f !== api) : [...prev, api]
    );
  };

  const buildFieldsPayload = () => {
    return selectedFields.map((field_name) => {
      let field_type = "text";
      if (field_name === "phone_numbers") field_type = "number";
      return {
        field_name,
        field_type,
        is_required: false,
      };
    });
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Template Name",
        description: "Please provide a template name.",
      });
      return;
    }

    if (selectedFields.length === 0) {
      toast({
        variant: "destructive",
        title: "No Fields Selected",
        description: "Please select at least one field for the template.",
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
          description: "Your new template has been added.",
        });

        setTemplateDialogOpen(false);
        setTemplateName("");
        setTemplateDescription("");
        setSelectedFields([]);
        window.location.href = "/template";
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Create Template",
          description:
            res?.message || res?.msg || "Unexpected error occurred.",
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
  }, [teamDialogOpen]);

  useEffect(() => {
    loadAccess();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You are not allowed to create teams.",
      });
      return;
    }

    const { team_name, manager_id, employees_id } = formData;

    if (!team_name || !manager_id || employees_id?.length === 0) {
      toast({
        variant: "destructive",
        title: "⚠️ Missing Required Fields",
        description: "Please fill all required fields.",
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
        description: "Your team has been created successfully.",
      });
      setTeamDialogOpen(false);
      setFormData({ team_name: "", manager_id: "", employees_id: [] });
      window.location.href = "/team";
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: res?.msg || "Unexpected error occurred.",
      });
    }
  };

  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">Eprevent Admin</h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Add New Team */}
          {canCreateTeam && (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setTeamDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Team
            </Button>
          )}

          {/* Create Template */}
          {canCreateTemplate && (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setTemplateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}

          {/* Add Event */}
          {canCreateEvent && (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={openEventDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Event
            </Button>
          )}

          {/* Logout */}
          <Button variant="outline" onClick={handleLogout}>
            LogOut
          </Button>
        </div>
      </header>

      {/* TEAM DIALOG */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a New Team</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="team_name">Team Name *</Label>
              <Input
              className="border-gray focus:border-gray"
                id="team_name"
                placeholder="Enter team name"
                value={formData.team_name}
                onChange={handleChange}
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
                <SelectTrigger className="border-gray focus:border-gray">
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
              <Command className="border rounded-md">
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
                      className="flex items-center space-x-1"
                      variant="secondary"
                    >
                      <span>{emp?.user_name || `User ${id}`}</span>
                      <X
                        className="w-3 h-3 cursor-pointer"
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

      {/* CREATE TEMPLATE DIALOG */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Template Name *</Label>
              <Input
              className="border-gray focus:border-gray"
                placeholder="Enter template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
              className="border-gray focus:border-gray"
                placeholder="Enter description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Select Fields *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {AVAILABLE_FIELDS.map((label) => {
                  const api = convertToApiKey(label);
                  return (
                    <label
                      key={label}
                      style={{ whiteSpace: "nowrap" }}
                      className="flex items-center gap-2 border p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(api)}
                        onChange={() => toggleField(label)}
                      />
                      <span className="select-none">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Brand Logo Image</Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="border-gray focus:border-gray mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={loading}>
              {loading ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
