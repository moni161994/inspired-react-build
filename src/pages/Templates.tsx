import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";

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
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">

          {/* ================= TEMPLATE TABLE ================= */}
          {!editing && (
            <>
              <h2 className="text-2xl font-semibold">Form Templates</h2>

              <table className="w-full border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Template Name</th>
                    <th className="p-3 text-left">Fields</th>
                    <th className="p-3 text-left">Created At</th>
                    <th className="p-3 text-left">Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-5">
                        No templates found
                      </td>
                    </tr>
                  ) : (
                    templates.map((tpl: any) => (
                      <tr key={tpl.id}>
                        <td className="p-3">{tpl.id}</td>
                        <td className="p-3">{tpl.template_name}</td>

                        <td className="p-3">
                          {tpl.fields
                            ?.map((f: any) => convertToLabel(f.field_name))
                            .join(", ")}
                        </td>

                        <td className="p-3">
                          {new Date(tpl.created_at).toLocaleString()}
                        </td>

                        <td className="p-3">
                          <Button size="sm" onClick={() => handleEdit(tpl)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* ================= EDIT MODAL ================= */}
          {editing && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto shadow-xl">

                <h2 className="text-xl font-semibold mb-4">Edit Template</h2>

                {/* NAME */}
                <label className="font-semibold">Template Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mb-3"
                />

                {/* DESC */}
                <label className="font-semibold">Description</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mb-3"
                />

                {/* FIELDS */}
                <label className="font-semibold">Select Fields</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_FIELDS.map((label) => {
                    const api = convertToApiKey(label);

                    return (
                      <label key={label} className="flex items-center gap-2 border p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedFields.some((f) => f.field_name === api)}
                          onChange={() => toggleField(label)}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>

                {/* BUTTONS */}
                <div className="flex gap-4 mt-6 justify-end">
                  <Button variant="secondary" onClick={() => setEditing(null)}>
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
