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
import { Trash2 } from "lucide-react";

// UI field names (labels)
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
  "Email Opt In"
];

// Convert API key → UI label
const convertToLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

// Convert UI label → API key
const convertToApiKey = (label: string) =>
  label.toLowerCase().replace(/\s+/g, "_");

function Templates() {
  const { request, loading } = useApi<any>();
  const { toast } = useToast();
  // Access Control States - NEW
  const [myAccess, setMyAccess] = useState<any>(null);
  const [canEditTemplate, setCanEditTemplate] = useState(false);
  const [canDeleteTemplate, setCanDeleteTemplate] = useState(false);

  const [templates, setTemplates] = useState<any[]>([]);
  const [originalTemplateImage, setOriginalTemplateImage] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; templateId: string | null }>({
    open: false,
    templateId: null,
  });

  const [selectedFields, setSelectedFields] = useState<any[]>([]);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [templateImageBase64, setTemplateImageBase64] = useState(""); // New state for image

  // ================= FETCH TEMPLATE LIST =================
  const fetchTemplates = async () => {
    const res = await request("/form_template_list", "GET");

    if (res?.success && res.data) {
      setTemplates(res.data);
    } else {
      toast({
        title: "Failed to fetch templates",
        description: "Something went wrong",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadMyAccess();
    fetchTemplates();
  }, []);

  // ================= OPEN EDIT POPUP =================
  // const handleEdit = (tpl: any) => {
  //   setEditing(tpl);

  //   setEditName(tpl.template_name);
  //   setEditDescription(tpl.description);
  //   setTemplateImageBase64(""); // Reset image on edit

  //   // Convert API keys to UI selected labels
  //   const mapped = tpl.fields.map((f: any) => convertToLabel(f.field_name));

  //   const fieldsForState = mapped.map((label: string) => ({
  //     field_name: convertToApiKey(label),
  //     field_type: "text",
  //     is_required: false,
  //     field_options: []
  //   }));

  //   setSelectedFields(fieldsForState);
  // };

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
          const pageName = page.replace("/", "").replace(/\/+$/, "") || "template";
          const suffix = `${action}_${pageName}`;
          return parsed.point.includes(suffix);
        };

        setCanEditTemplate(hasPage("/template") && hasAction("/template", "edit_template"));
        setCanDeleteTemplate(hasPage("/template") && hasAction("/template", "delete_template"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
      setCanEditTemplate(false);
      setCanDeleteTemplate(false);
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


  const handleEdit = (tpl: any) => {
    setEditing(tpl);
    setOriginalTemplateImage(tpl.template_image || ""); // Store original image

    setEditName(tpl.template_name);
    setEditDescription(tpl.description);
    setTemplateImageBase64(""); // Reset new image on edit

    // Convert API keys to UI selected labels
    const mapped = tpl.fields.map((f: any) => convertToLabel(f.field_name));

    const fieldsForState = mapped.map((label: string) => ({
      field_name: convertToApiKey(label),
      field_type: "text",
      is_required: false,
      field_options: []
    }));

    setSelectedFields(fieldsForState);
  };

  // ================= IMAGE HANDLER =================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:image/... prefix
        setTemplateImageBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // ================= DELETE HANDLER =================
  const handleDelete = (templateId: string) => {
    setDeleteDialog({ open: true, templateId });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.templateId) return;

    try {
      const res = await request(
        `/delete_form_template?template_id=${deleteDialog.templateId}`,
        "DELETE"
      );

      if (res?.success) {
        toast({
          title: "Success",
          description: "Template deleted successfully"
        });

        fetchTemplates(); // refresh table
      } else {
        toast({
          title: "Delete Failed",
          description: res?.error || res?.message || "Cannot delete template. It is assigned to one or more events.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete template",
        variant: "destructive"
      });
    }

    setDeleteDialog({ open: false, templateId: null });
  };

  // ================= TOGGLE CHECKBOX =================
  const toggleField = (label: string) => {
    const apiField = convertToApiKey(label);

    setSelectedFields((prev) => {
      const exists = prev.some((f) => f.field_name === apiField);

      if (exists) {
        return prev.filter((f) => f.field_name !== apiField);
      }

      return [
        ...prev,
        {
          field_name: apiField,
          field_type: "text",
          is_required: false,
          field_options: []
        }
      ];
    });
  };

  // ================= UPDATE TEMPLATE =================
  // const handleUpdate = async () => {
  //   const payload: any = {
  //     template_name: editName,
  //     description: editDescription,
  //     fields: selectedFields
  //   };

  //   // Add image only if a new one was selected
  //   if (templateImageBase64) {
  //     payload.template_image_base64 = templateImageBase64;
  //   }

  //   const res = await request(
  //     `/edit_form_template?template_id=${editing.id}`,
  //     "PUT",
  //     payload
  //   );

  //   if (res?.success) {
  //     toast({
  //       title: "Success",
  //       description: "Template updated successfully"
  //     });

  //     setEditing(null);
  //     setTemplateImageBase64(""); // Reset image
  //     fetchTemplates();
  //   } else {
  //     toast({
  //       title: "Update Failed",
  //       description: res?.message || "Something went wrong",
  //       variant: "destructive"
  //     });
  //   }
  // };

  const handleUpdate = async () => {
    const payload: any = {
      template_name: editName,
      description: editDescription,
      fields: selectedFields
    };

    // Only add new image if one was selected, otherwise keep original
    if (templateImageBase64) {
      payload.template_image_base64 = templateImageBase64;
    } else if (originalTemplateImage) {
      // If no new image selected but original exists, preserve it
      payload.template_image = originalTemplateImage;
    }

    const res = await request(
      `/edit_form_template?template_id=${editing.id}`,
      "PUT",
      payload
    );

    if (res?.success) {
      toast({
        title: "Success",
        description: "Template updated successfully"
      });

      setEditing(null);
      setTemplateImageBase64(""); // Reset new image
      setOriginalTemplateImage(""); // Reset original image
      fetchTemplates();
    } else {
      toast({
        title: "Update Failed",
        description: res?.message || "Something went wrong",
        variant: "destructive"
      });
    }
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
                {/* <TableHead>ID</TableHead> */}
                <TableHead>Template Name</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Created At</TableHead>
                {(canDeleteTemplate ||canEditTemplate) && <TableHead className="w-32">Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center p-5 h-24">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl: any) => (
                  <TableRow key={tpl.id}>
                    {/* <TableCell>{tpl.id}</TableCell> */}
                    <TableCell>{tpl.template_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tpl.fields
                        ?.map((f: any) => convertToLabel(f.field_name))
                        .join(", ")}
                    </TableCell>
                    <TableCell>{
                      tpl.template_image && (
                        <img
                          src={tpl.template_image}
                          alt="template"
                          style={{ height: "80px", width: "100px", objectFit: "cover" }}
                        />
                      )
                    }</TableCell>
                    <TableCell>
                      {new Date(tpl.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {canEditTemplate && (
                        <Button
                          size="sm"
                          onClick={() => handleEdit(tpl)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Edit
                        </Button>
                      )}
                      {canDeleteTemplate && <AlertDialog open={deleteDialog.open && deleteDialog.templateId === tpl.id}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(tpl.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete template <strong>{tpl.template_name}</strong>?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, templateId: null })}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {editing && (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
              <div className="bg-background p-6 rounded-sm max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border">
                <h2 className="text-xl font-semibold mb-4">Edit Template</h2> 

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Template Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border-gray focus:border-gray"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">Description</label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full border-gray focus:border-gray"
                    />
                  </div>

                  {/* New Image Upload Section */}
                  {/* <div>
                    <label className="text-sm font-semibold mb-1 block">Template Image</label>
                   
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full"
                    />
                    {templateImageBase64 ? (
                      <div className="mt-2">
                        <img 
                          src={`data:image/png;base64,${templateImageBase64}`} 
                          alt="preview" 
                          style={{height:"80px", width:"100px", objectFit:"cover"}}
                          className="rounded border mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Image selected</p>
                      </div>
                    ) 
                  :  <img src={editing.template_image}></img>}
                  </div> */}

                

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Select Fields</label>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {AVAILABLE_FIELDS.map((label) => {
                        const api = convertToApiKey(label);
                        return (
                          <label key={label} className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFields.some((f) => f.field_name === api)}
                              onChange={() => toggleField(label)}
                              className="rounded"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Template Image</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full border-gray focus:border-gray"
                    />
                    <div className="mt-2">
                      {templateImageBase64 ? (
                        // Show new selected image
                        <img
                          src={`data:image/png;base64,${templateImageBase64}`}
                          alt="preview"
                          style={{ height: "80px", width: "100px", objectFit: "cover" }}
                          className="rounded border border-gray focus:border-gray"
                        />
                      ) : originalTemplateImage ? (
                        // Show original image if no new one selected
                        <img
                          src={originalTemplateImage}
                          alt="current template"
                          style={{ height: "80px", width: "100px", objectFit: "cover" }}
                          className="rounded border border-gray focus:border-gray"
                        />
                      ) : (
                        // Show placeholder if no image
                        <div className=" bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                      {templateImageBase64 && (
                        <p className="text-xs text-muted-foreground mt-1">New image selected</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setTemplateImageBase64("");
                    }}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Templates;
