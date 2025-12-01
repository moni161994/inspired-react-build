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

  const [templates, setTemplates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; templateId: string | null }>({
    open: false,
    templateId: null,
  });

  const [selectedFields, setSelectedFields] = useState<any[]>([]);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
    fetchTemplates();
  }, []);

  // ================= OPEN EDIT POPUP =================
  const handleEdit = (tpl: any) => {
    setEditing(tpl);

    setEditName(tpl.template_name);
    setEditDescription(tpl.description);

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

  // ================= DELETE HANDLER =================
  const handleDelete = (templateId: string) => {
    setDeleteDialog({ open: true, templateId });
  };

  const confirmDelete = () => {
    if (deleteDialog.templateId) {
      setTemplates((prev) => prev.filter((item) => item.id !== deleteDialog.templateId));
      setDeleteDialog({ open: false, templateId: null });
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
    }
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
  const handleUpdate = async () => {
    const payload = {
      template_name: editName,
      description: editDescription,
      fields: selectedFields
    };

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
                <TableHead>ID</TableHead>
                <TableHead>Template Name</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-5 h-24">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl: any) => (
                  <TableRow key={tpl.id}>
                    <TableCell>{tpl.id}</TableCell>
                    <TableCell>{tpl.template_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tpl.fields
                        ?.map((f: any) => convertToLabel(f.field_name))
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      {new Date(tpl.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(tpl)}>
                        Edit
                      </Button>
                      <AlertDialog open={deleteDialog.open && deleteDialog.templateId === tpl.id}>
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
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {editing && (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
              <div className="bg-background p-6 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl border">
                <h2 className="text-xl font-semibold mb-4">Edit Template</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Template Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">Description</label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Select Fields</label>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
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
                </div>

                <div className="flex gap-4 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditing(null)}
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
