import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

// --- TYPES & CONSTANTS ---
type TemplateType = "booth_give_away" | "full_lead_form" | "workshop";

type FieldConfig = {
  key: string;
  required: boolean;
};

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
  "Capture Data Consent",
  "Term And Condition",
  "Urgency",
  "Email Opt In",
  "(Email Consent) Signature", // Display Name
];

// UPDATED: Helper to handle the specific mapping for Signature
const convertToApiKey = (label: string) => {
  // If the label is the UI-specific signature name, return the strict DB key "signature"
  if (label === "(Email Consent) Signature") {
    return "signature";
  }
  return label.toLowerCase().replace(/\s+/g, "_");
};

function Templates() {
  const { request, loading } = useApi<any>();
  const { toast } = useToast();

  // Access Control
  const [myAccess, setMyAccess] = useState<any>(null);
  const [canEditTemplate, setCanEditTemplate] = useState(false);
  const [canDeleteTemplate, setCanDeleteTemplate] = useState(false);

  // List Data
  const [templates, setTemplates] = useState<any[]>([]);

  // Edit State
  const [editing, setEditing] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [originalTemplateImage, setOriginalTemplateImage] = useState("");
  const [templateImageBase64, setTemplateImageBase64] = useState("");

  // Edit State - TABS & SELECTIONS (Updated to store Objects)
  const [activeTab, setActiveTab] = useState<TemplateType>("booth_give_away");
  const [fieldSelections, setFieldSelections] = useState<
    Record<TemplateType, FieldConfig[]>
  >({
    booth_give_away: [],
    full_lead_form: [],
    workshop: [],
  });

  // Delete State
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    templateId: string | null;
  }>({
    open: false,
    templateId: null,
  });

  // ================= FETCH TEMPLATES =================
  const fetchTemplates = async () => {
    const res = await request("/form_template_list", "GET");
    if (res?.success && res.data) {
      setTemplates(res.data);
    } else {
      toast({ title: "Failed to fetch templates", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadMyAccess();
    fetchTemplates();
  }, []);

  // ================= LOAD ACCESS =================
  const loadMyAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      const res = await request(`/get_single_access/${userId}`, "GET");
      if (res?.status_code === 200 && res.data) {
        const parsed: any = {
          page: JSON.parse(res.data.page),
          point: JSON.parse(res.data.point),
          user_id: Number(res.data.user_id),
        };
        setMyAccess(parsed);
        const hasPage = (p: string) => parsed.page.includes(p);
        const hasAction = (page: string, action: string) => {
          const pageName =
            page.replace("/", "").replace(/\/+$/, "") || "template";
          const suffix = `${action}_${pageName}`;
          return parsed.point.includes(suffix);
        };
        setCanEditTemplate(
          hasPage("/template") && hasAction("/template", "edit_template")
        );
        setCanDeleteTemplate(
          hasPage("/template") && hasAction("/template", "delete_template")
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };

  // ================= HANDLE EDIT CLICK =================
  const handleEdit = (tpl: any) => {
    setEditing(tpl);
    setOriginalTemplateImage(tpl.template_image || "");
    setEditName(tpl.template_name);
    setEditDescription(tpl.description);
    setTemplateImageBase64("");
    setActiveTab("booth_give_away");

    // Parse existing fields into categories with required status
    const newSelections: Record<TemplateType, FieldConfig[]> = {
      booth_give_away: [],
      full_lead_form: [],
      workshop: [],
    };

    if (tpl.fields && Array.isArray(tpl.fields)) {
      tpl.fields.forEach((field: any) => {
        const type = field.field_type as TemplateType;
        const name = field.field_name;
        // Check if API returns '1', 'true', or true for is_required
        const isReq =
          field.is_required === true ||
          field.is_required === 1 ||
          field.is_required === "1" ||
          field.is_required === "true";

        if (newSelections[type]) {
          // Avoid duplicates
          const exists = newSelections[type].find((f) => f.key === name);
          if (!exists) {
            newSelections[type].push({ key: name, required: isReq });
          }
        }
      });
    }

    setFieldSelections(newSelections);
  };

  // ================= IMAGE UPLOAD =================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setTemplateImageBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // ================= DELETE LOGIC =================
  const handleDelete = (templateId: string) =>
    setDeleteDialog({ open: true, templateId });

  const confirmDelete = async () => {
    if (!deleteDialog.templateId) return;
    try {
      const res = await request(
        `/delete_form_template?template_id=${deleteDialog.templateId}`,
        "DELETE"
      );
      if (res?.success) {
        toast({ title: "Success", description: "Template deleted" });
        fetchTemplates();
      } else {
        toast({
          title: "Failed",
          description: res?.message || "Cannot delete.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
    setDeleteDialog({ open: false, templateId: null });
  };

  // ================= FIELD TOGGLE LOGIC =================

  // 1. Add/Remove Field
  const toggleField = (label: string) => {
    const apiField = convertToApiKey(label);
    const emailOptInKey = convertToApiKey("Email Opt In");
    const signatureKey = convertToApiKey("(Email Consent) Signature"); // Returns "signature"

    setFieldSelections((prev) => {
      const currentList = prev[activeTab];
      const exists = currentList.find((f) => f.key === apiField);

      let newList;
      if (exists) {
        // Remove
        newList = currentList.filter((f) => f.key !== apiField);

        // Logic: If user unselects 'email_opt_in', also unselect 'signature'
        if (apiField === emailOptInKey) {
          newList = newList.filter((f) => f.key !== signatureKey);
        }
      } else {
        // Add (default to not required)
        newList = [...currentList, { key: apiField, required: false }];
      }

      return { ...prev, [activeTab]: newList };
    });
  };

  // 2. Toggle Required Status
  const toggleRequired = (label: string) => {
    const apiField = convertToApiKey(label);

    setFieldSelections((prev) => {
      const currentList = prev[activeTab];
      const newList = currentList.map((f) =>
        f.key === apiField ? { ...f, required: !f.required } : f
      );
      return { ...prev, [activeTab]: newList };
    });
  };

  // ================= UPDATE SUBMIT =================
  const handleUpdate = async () => {
    // Rebuild payload from 3 tabs
    let combinedFields: any[] = [];

    (Object.keys(fieldSelections) as TemplateType[]).forEach((type) => {
      const fieldsForType = fieldSelections[type];
      const mappedFields = fieldsForType.map((field) => ({
        field_name: field.key, // This will be "signature" for the signature field
        field_type: type,
        is_required: field.required, // Pass boolean
        field_options: [],
      }));
      combinedFields = [...combinedFields, ...mappedFields];
    });

    if (combinedFields.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one field.",
        variant: "destructive",
      });
      return;
    }

    const payload: any = {
      template_name: editName,
      description: editDescription,
      fields: combinedFields,
    };

    if (templateImageBase64) {
      payload.template_image_base64 = templateImageBase64;
    } else if (originalTemplateImage) {
      payload.template_image = originalTemplateImage;
    }

    const res = await request(
      `/edit_form_template?template_id=${editing.id}`,
      "PUT",
      payload
    );

    if (res?.success) {
      toast({ title: "Success", description: "Template updated successfully" });
      setEditing(null);
      setTemplateImageBase64("");
      setOriginalTemplateImage("");
      fetchTemplates();
    } else {
      toast({
        title: "Update Failed",
        description: res?.message,
        variant: "destructive",
      });
    }
  };

  // Helper component for checkboxes inside Tabs
  const FieldCheckboxes = () => {
    const currentSelectedList = fieldSelections[activeTab];
    const allKeys = AVAILABLE_FIELDS.map(convertToApiKey);
    const isAllSelected = currentSelectedList.length === allKeys.length;

    // Check if Email Opt In is currently selected for this tab
    const emailOptInKey = convertToApiKey("Email Opt In");
    const signatureKey = convertToApiKey("(Email Consent) Signature"); // Returns "signature"

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
        {/* Select All Button */}
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

            // Check if object exists in array
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
    <div className="flex h-screen bg-background relative z-0">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Form Templates</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Created At</TableHead>
                {(canDeleteTemplate || canEditTemplate) && (
                  <TableHead className="w-32">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center p-5 h-24 text-muted-foreground"
                  >
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl: any) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">
                      {tpl.template_name}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {tpl.description}
                    </TableCell>
                    <TableCell>
                      {tpl.template_image && (
                        <img
                          src={tpl.template_image}
                          alt="template"
                          className="h-10 w-16 object-cover rounded border"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(tpl.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {canEditTemplate && (
                        <Button
                          size="sm"
                          onClick={() => handleEdit(tpl)}
                          variant="outline"
                        >
                          Edit
                        </Button>
                      )}
                      {canDeleteTemplate && (
                        <AlertDialog
                          open={
                            deleteDialog.open &&
                            deleteDialog.templateId === tpl.id
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tpl.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Template
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() =>
                                  setDeleteDialog({
                                    open: false,
                                    templateId: null,
                                  })
                                }
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={confirmDelete}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ================= EDIT DIALOG ================= */}
          <Dialog
            open={!!editing}
            onOpenChange={(open) => !open && setEditing(null)}
          >
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw]">
              <DialogHeader>
                <DialogTitle className="text-xl">Edit Template</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Top Row: Name & Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Template Name
                      </Label>
                      <Input
                        className="mt-1.5"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Input
                        className="mt-1.5"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Template Image
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1.5 cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />

                    <div className="mt-3 bg-muted/20 p-2 rounded border border-dashed flex items-center justify-center min-h-[100px]">
                      {templateImageBase64 ? (
                        <div className="text-center">
                          <img
                            src={`data:image/png;base64,${templateImageBase64}`}
                            alt="New"
                            className="h-24 w-auto object-contain rounded mx-auto"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            New Image Selected
                          </p>
                        </div>
                      ) : originalTemplateImage ? (
                        <img
                          src={originalTemplateImage}
                          alt="Original"
                          className="h-24 w-auto object-contain rounded opacity-90"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No image uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* TABS SECTION */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <Label className="text-base font-semibold">
                      Edit Fields per Type
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Switch tabs to configure fields for each scenario
                    </span>
                  </div>

                  <Tabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as TemplateType)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1 bg-muted/50">
                      <TabsTrigger value="booth_give_away" className="py-2.5">
                        Booth Give Away
                      </TabsTrigger>
                      <TabsTrigger value="full_lead_form" className="py-2.5">
                        Full Lead Form
                      </TabsTrigger>
                      <TabsTrigger value="workshop" className="py-2.5">
                        Workshop
                      </TabsTrigger>
                    </TabsList>

                    {["booth_give_away", "full_lead_form", "workshop"].map(
                      (tabKey) => (
                        <TabsContent
                          key={tabKey}
                          value={tabKey}
                          className="border rounded-lg p-5 bg-slate-50/50 shadow-sm mt-0"
                        >
                          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
                            <h4 className="font-semibold text-sm text-foreground/80 capitalize">
                              {tabKey.replace(/_/g, " ")} Fields
                            </h4>
                            <div className="flex gap-2">
                              <Badge
                                variant="outline"
                                className="bg-white px-3 py-1 text-xs font-normal"
                              >
                                {fieldSelections[tabKey as TemplateType].length}{" "}
                                Selected
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-white px-3 py-1 text-xs font-normal text-red-600 border-red-200"
                              >
                                {
                                  fieldSelections[
                                    tabKey as TemplateType
                                  ].filter((f) => f.required).length
                                }{" "}
                                Required
                              </Badge>
                            </div>
                          </div>
                          <FieldCheckboxes />
                        </TabsContent>
                      )
                    )}
                  </Tabs>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-4 border-t sticky bottom-0 bg-background pb-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setTemplateImageBase64("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="px-6"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default Templates;