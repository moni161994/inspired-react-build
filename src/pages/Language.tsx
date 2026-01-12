import { useState, useEffect, useRef } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, Plus, Upload, FileDown, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
type Language = {
  language_code: string;
  language_name: string;
  is_active: boolean;
};

// --- Predefined Translation Keys ---
const PREDEFINED_KEYS = [
  "Dashboard",
  "Profile", 
  "Leads",
  "Support",
  "Total Lead",
  "Logout",
  "New Lead Captured",
  "CRM Sync Completed",
  "CRM Sync",
  "Hot Lead Identified",
  "Hide Details",
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
  "Captured by",
  "Support?",
  "How we can help you",
  "For any queries or support",
  "please email us at",
  "FAQs",
  "How can I contact support?",
  "What should I include in my email?",
  "What are your support hours?",
  "My Profile",
  "Employee ID",
  "Teams",
  "Parent ID",
  "Status",
  "Active",
  "Total Leads",
  "Total Events",
  "Active Events",
  "Offline Leads",
  "Recent Activity",
  "All",
  "View All",
  "Add Lead Capture",
  "Select Event",
  "Photo",
  "Manual",
  "Click below to capture lead via camera",
  "Take a Photo",
  "Lead Capture", 
  "Badge Capture",
  "No Records Found"
] as const;

export default function LanguageManagement() {
  // --- State: General & Permissions ---
  const [languages, setLanguages] = useState<Language[]>([]);
  const [myAccess, setMyAccess] = useState<any>(null);
  
  const [canCreateLanguage, setCanCreateLanguage] = useState(false);
  const [canEditLanguage, setCanEditLanguage] = useState(false);
  const [canDeleteLanguage, setCanDeleteLanguage] = useState(false);

  // --- State: Dialog (Unified Create/Edit) ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [formData, setFormData] = useState({
    language_name: "",
    language_code: "",
    translations: {} as Record<string, string>
  });

  // --- State: Bulk Upload ---
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0 to 100
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { request, loading } = useApi();
  const { toast } = useToast();

  // --- Initial Load ---
  useEffect(() => {
    loadMyAccess(); 
    fetchLanguages();
  }, []);

  // --- Helpers: Access Control ---
  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };
  
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
          const pageName = page.replace("/", "").replace(/\/+$/, "") || "language";
          const suffix = `${action}_${pageName}`;
          return parsed.point.includes(suffix);
        };
  
        setCanCreateLanguage(hasPage("/language") && hasAction("/language", "create_language"));
        setCanEditLanguage(hasPage("/language") && hasAction("/language", "edit_language"));
        setCanDeleteLanguage(hasPage("/language") && hasAction("/language", "delete_language"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
      setCanCreateLanguage(false);
      setCanEditLanguage(false);
      setCanDeleteLanguage(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const res = await request("/get_languages", "GET");
      if (res?.status_code === 200 && Array.isArray(res.data)) {
        const formattedLanguages: Language[] = res.data.map((lang: any) => ({
          ...lang,
          is_active: Boolean(lang.is_active)
        }));
        setLanguages(formattedLanguages);
      } else {
        setLanguages([]);
      }
    } catch (error) {
      console.error('fetchLanguages error:', error);
      setLanguages([]);
    }
  };

  // --- Logic: Unified Dialog (Create/Edit) ---
  const openEditor = async (lang?: Language) => {
    setIsDialogOpen(true);

    if (lang) {
      setEditingLanguage(lang);
      
      let existingTranslations = {};
      try {
        const res = await request("/get_language_translations", "POST", {
          language_code: lang.language_code,
        });
        if (res?.status_code === 200 && res.data) {
          existingTranslations = res.data;
        }
      } catch (e) {
        console.error("Failed to fetch translations", e);
      }

      const mergedTranslations: Record<string, string> = {};
      PREDEFINED_KEYS.forEach(key => {
        // @ts-ignore
        mergedTranslations[key] = existingTranslations[key] || "";
      });

      setFormData({
        language_name: lang.language_name,
        language_code: lang.language_code,
        translations: mergedTranslations
      });

    } else {
      setEditingLanguage(null);
      const emptyTranslations: Record<string, string> = {};
      PREDEFINED_KEYS.forEach(key => { emptyTranslations[key] = ""; });

      setFormData({
        language_name: "",
        language_code: "",
        translations: emptyTranslations
      });
    }
  };

  const updateTranslationKey = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: { ...prev.translations, [key]: value }
    }));
  };

  const handleSaveAllData = async () => {
    if (!formData.language_name.trim() || !formData.language_code.trim()) {
      toast({ title: "Name and Code required", variant: "destructive" });
      return;
    }

    try {
      const languageApiCall = editingLanguage
        ? request("/update_language", "POST", {
            language_id: editingLanguage.language_code,
            language_name: formData.language_name,
            language_code: formData.language_code,
          })
        : request("/create_language", "POST", {
            language_name: formData.language_name,
            language_code: formData.language_code,
          });

      const translationsApiCall = request("/save_language_translations", "POST", {
        language_code: formData.language_code,
        translations: formData.translations,
      });

      const [langRes, transRes] = await Promise.all([languageApiCall, translationsApiCall]);

      if ((langRes?.status_code === 200 || langRes?.status_code === 201) && 
          (transRes?.success || transRes?.status_code === 200)) {
        toast({ title: "Saved successfully!" });
        setIsDialogOpen(false);
        fetchLanguages();
      } else {
        toast({ title: "Saved with warnings", description: "Check console for details.", variant: "default" });
        fetchLanguages();
      }
    } catch (e) {
      toast({ title: "Error saving", variant: "destructive" });
    }
  };

  const handleDeleteLanguage = async (languageCode: string) => {
    if (!window.confirm("Delete this language?")) return;
    const res = await request("/delete_language", "POST", { language_code: languageCode });
    if (res?.status_code === 200) {
      toast({ title: "Deleted" });
      fetchLanguages();
    }
  };

  // --- Logic: Bulk Import (Frontend Loop) ---
  
  // Helper to parse CSV line respecting quotes "Value, with comma"
  const parseCSVLine = (text: string) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
            let field = text.substring(start, i).trim();
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.substring(1, field.length - 1).replace(/""/g, '"');
            }
            result.push(field);
            start = i + 1;
        }
    }
    let lastField = text.substring(start).trim();
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
        lastField = lastField.substring(1, lastField.length - 1).replace(/""/g, '"');
    }
    result.push(lastField);
    return result;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) await processCSV(text);
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const processCSV = async (csvText: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) {
      toast({ title: "Empty or invalid CSV", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const headers = parseCSVLine(lines[0]);
    // Validate Headers
    const codeIndex = headers.findIndex(h => h.toLowerCase() === "language_code");
    const nameIndex = headers.findIndex(h => h.toLowerCase() === "language_name");

    if (codeIndex === -1 || nameIndex === -1) {
      toast({ title: "Invalid Columns", description: "CSV must have 'language_code' and 'language_name'.", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    let successCount = 0;
    const totalRows = lines.length - 1;

    // Loop through rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCSVLine(lines[i]);
      if (rowValues.length < 2) continue; // Skip empty/malformed

      const langCode = rowValues[codeIndex];
      const langName = rowValues[nameIndex];

      if (!langCode || !langName) continue;

      try {
        // 1. Create/Update Language
        await request("/create_language", "POST", {
          language_name: langName,
          language_code: langCode,
        });

        // 2. Prepare Translations
        const transPayload: Record<string, string> = {};
        let hasTrans = false;

        PREDEFINED_KEYS.forEach(key => {
          const keyIndex = headers.indexOf(key);
          if (keyIndex !== -1 && rowValues[keyIndex]) {
            transPayload[key] = rowValues[keyIndex];
            hasTrans = true;
          }
        });

        // 3. Save Translations (if any exist in row)
        if (hasTrans) {
          await request("/save_language_translations", "POST", {
            language_code: langCode,
            translations: transPayload,
          });
        }
        
        successCount++;
      } catch (err) {
        console.error(`Error importing ${langCode}`, err);
      }

      // Update Progress
      setUploadProgress(Math.round((i / totalRows) * 100));
    }

    setIsUploading(false);
    toast({ title: "Import Complete", description: `Successfully processed ${successCount} languages.` });
    fetchLanguages();
  };

  const downloadSampleCSV = () => {
    // Construct CSV content
    const headerRow = ["language_code", "language_name", ...PREDEFINED_KEYS];
    // Helper to escape CSV values
    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    
    const sampleRow = [
      "es", "Spanish", 
      ...PREDEFINED_KEYS.map(k => `${k}`) // Dummy translation values
    ];

    const csvContent = [
      headerRow.map(escapeCsv).join(","),
      sampleRow.map(escapeCsv).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "languages_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-lg font-semibold text-foreground">Languages</h2>
            
            <div className="flex flex-wrap gap-2">
              {/* Hidden File Input */}
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />

              {canCreateLanguage && (
                <>
                  <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                    <FileDown className="w-4 h-4 mr-2" /> Sample CSV
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isUploading ? "Importing..." : "Bulk Import"}
                  </Button>

                  <Button size="sm" onClick={() => openEditor()}>
                    <Plus className="w-4 h-4 mr-2" /> Add Language
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar (Visible only during upload) */}
          {isUploading && (
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Importing languages... Do not close this page.</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Language Name</th>
                      {/* <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th> */}
                      {(canDeleteLanguage || canEditLanguage) &&<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((language) => (
                      <tr key={language.language_code} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono">{language.language_code}</td>
                        <td className="py-3 px-4">{language.language_name}</td>
                        {/* <td className="py-3 px-4">
                          <Badge variant={language.is_active ? "default" : "secondary"}>
                            {language.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td> */}
                        <td className="py-3 px-4 space-x-2">
                          {canEditLanguage && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditor(language)}
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {canDeleteLanguage && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteLanguage(language.language_code)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {languages.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          No languages found. Add one or import via CSV.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Unified Language Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingLanguage ? `Edit ${editingLanguage.language_name}` : "Create New Language"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {/* Section 1: Basic Details */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/10">
              <h3 className="text-sm font-semibold mb-4 text-foreground/80">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language_name">Language Name *</Label>
                  <Input
                  className="border-gray focus:border-gray"
                    id="language_name"
                    placeholder="e.g. French"
                    value={formData.language_name}
                    onChange={(e) => setFormData({ ...formData, language_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="language_code">Language Code *</Label>
                  <Input
                  className="border-gray focus:border-gray"
                    id="language_code"
                    placeholder="e.g. fr"
                    value={formData.language_code}
                    onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                    disabled={!!editingLanguage} 
                  />
                  {editingLanguage && <p className="text-xs text-muted-foreground mt-1">Code cannot be changed.</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Translations */}
            <div>
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 border-b">
                <h3 className="text-sm font-semibold text-foreground/80">Translations</h3>
                <Badge variant="outline">{PREDEFINED_KEYS.length} keys</Badge>
              </div>
              
              <div className="space-y-3 pb-4">
                {PREDEFINED_KEYS.map((key) => (
                  <div key={key} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 border rounded-md hover:bg-muted/5 transition-colors">
                    <div className="md:col-span-4 flex flex-col justify-center">
                      <Label className="text-xs font-mono text-muted-foreground break-words leading-tight">
                        {key}
                      </Label>
                    </div>
                    <div className="md:col-span-8">
                      <Textarea
                        value={formData.translations[key] || ""}
                        onChange={(e) => updateTranslationKey(key, e.target.value)}
                        placeholder={`Translate "${key}"...`}
                        className="min-h-[2.5rem] py-2 resize-y text-sm"
                        rows={1}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-2 bg-background">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAllData} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
              {loading ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}