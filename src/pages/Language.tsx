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
import { Trash2, Edit3, Plus, Upload, FileDown, Loader2, AlertTriangle } from "lucide-react";
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
  "No Records Found",
  "To get Started",
  "Enter Your Install Code",
  "Enter Install Code",
  "Choose your Language",
  "Continue",
  "Welcome Back",
  "Email or Phone",
  "Code",
  "Submit",
  "Error",
  "Login Failed",
  "Invalid credentials",
  "Please enter email and 5 digit code",
  "Something went wrong",
  "Please enter your email",
  "Failed to send OTP",
  "Something went wrong while sending OTP",
  "Selection Required",
  "Please select a language to continue",
  "Failed to load languages",
  "Something went wrong fetching languages",
  "Failed to download language pack. Please try again.",
  "Check your internet connection and try again.",
  "Hello,",
  "User",
  "Nothing to sync",
  "Manual Lead",
  "Captured Lead",
  "Some Leads Not Synced",
  "leads could not be synced.",
  "Go to Pending",
  "All captured leads uploaded successfully!",
  "Something went wrong while syncing captured leads.",
  "New lead Capture",
  "New Leads in oﬄine mode",
  "Need Sync",
  "New lead capture with Consent",
  "New event activated",
  "Performance Overview",
  "Conversion Rate",
  "Sync Success",
  "Activity History",
  "clicked",
  "Confirm Delete",
  "Are you sure you want to delete this event?",
  "Delete",
  "Cancel",
  "Delete failed",
  "Event updated successfully",
  "Update failed",
  "Event ID",
  "Priority",
  "Budget",
  "Size",
  "No records found",
  "Notifications",
  "Camera loading...",
  "Offline Mode",
  "Image saved locally. Fill details & submit to save complete lead offline.",
  "Continue Offline",
  "Pending Uploads",
  "Upload failed",
  "No QR code detected from Vision",
  "Failed to capture photo",
  "Failed to pick image",
  "Gallery",
  "Show Contact Details",
  "Hide Contact Details",
  "Contact Details",
  "Other Details",
  "QR Code",
  "Role",
  "Successful Upload",
  "Captured on",
  "Yes",
  "No",
  "Leads",
  "Lead Capture",
  "Badge Capture",
  "Sync Offline",
  "Syncing...",
  "Unknown Name",
  "No email",
  "No phone",
  "Confirm Delete",
  "Are you sure you want to delete this lead?",
  "Delete",
  "Cancel",
  "No Records Found",
  "No active event found to sync this lead.",
  "Lead synced & text extracted!",
  "Could not sync lead, saved offline.",
  "Check your internet connection. Lead saved offline.",
  "No offline leads saved",
  "Sync",     
  "Phone",    
  "Email",
  "Delete Lead",
  "All captured leads synced successfully!",
  "Failed to sync captured leads.",
  "Internet not available for sync.",
  "OCR Failed",
  "Please update your plan",
  "Validation Error",
  "Name is required for upload.",
  "Lead synced successfully!",
  "Sync Failed",
  "Lead saved for retry.",
  "Sync All",
  "No offline leads",
  "Lead Image",
  "Pending",
  "Add Lead Capture",
  "Select Event",
  "No existing field in this event template",
  "Captured Photo",
  "Lead Details",
  "Enter Name",
  "Enter Designation",
  "Enter Company",
  "Enter Phone",
  "Enter Email",
  "Enter Website",
  "Enter Role (comma separated)",
  "Enter / Edit QR Data",
  "Enter Disclaimer",
  "Enter City",
  "Enter State",
  "Enter Zip",
  "Enter Country",
  "Area of Interest - Category",
  "Make a selection >",
  "Add Signature",
  "View >",
  "Opted In",
  "Opted Out",
  "Data Consent",
  "Consented",
  "Declined",
  "Terms & Conditions",
  "Accepted",
  "Submit Lead Capture",
  "Submit Manual Form",
  "Take a Photo",
  "Oops!",
  "is mandatory. Please fill them.",
  "are mandatory. Please fill them.",
  "Invalid Email",
  "Please enter a valid email (e.g., user@gmail.com)",
  "Invalid Website",
  "Please enter a valid website (e.g., www.example.com)",
  "Invalid Phone",
  "Phone number must be 10 digits",
  "Saved Offline",
  "Lead saved! Total pending:",
  "Complete lead saved offline with all manual fields.",
  "No speech detected, stopping mic safely",
  "By entering your email address, you are Opting In to receive Marketing emails from Epredia.",
  "This will allow us to digitally communicate with you via emails regarding products and services that we feel may be of interest to you or that are similar to those that you have already purchased or enquired about.",
  "You may be contacted by us, or by one of our selected partners, in each case where you have consented to receive these communications.",
  "You may opt out of receiving our marketing communications at any time by contacting us at privacy@epredia.com or by using the Unsubscribe link in any of our communications.",
  "We will continue to contact you for non-marketing related purposes where we need to issue a field corrective or safety notice, or where we need to send certain information to you under a legal, regulatory, or ethical requirement.",
  "Thank you.",
  "Opt-In",
  "Opt-Out",
  "Done",
  "Clear",
  "Decline",
  "Consent",
  "Accept",
  "I consent to the collection and processing of my personal data for this event.",
  "This includes name, contact details, and professional information provided.",
  "Data will be used for event follow-up and marketing communications (if opted in).",
  "You may withdraw consent at privacy@epredia.com at any time.",
  "By accepting these terms, you agree to our Terms & Conditions and Privacy Policy.",
  "This will allow us to process your lead information securely and in compliance with data protection regulations.",
  "You may review the full terms at any time by contacting privacy@epredia.com.",
  "Anatomy Software",
  "Archiving & Storage",
  "Blades",
  "Cryotomy",
  "Cytology",
  "Digital Pathology",
  "Immunohistochemistry",
  "Instrument Service",
  "Labeling & Tracking",
  "Microscope Slides"
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

  // --- State: Bulk Upload & Export ---
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [statusMessage, setStatusMessage] = useState(""); // To show "Deleting..." vs "Importing..."
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
        return formattedLanguages; // Return for usage in delete function
      } else {
        setLanguages([]);
        return [];
      }
    } catch (error) {
      console.error('fetchLanguages error:', error);
      setLanguages([]);
      return [];
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

    // Safety Confirmation
    if (!window.confirm("⚠️ WARNING: This will DELETE ALL existing languages and replace them with the CSV data. Continue?")) {
        event.target.value = ""; // Reset input
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) await processCSV(text);
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  // Helper to delete all languages before import
  const deleteAllExistingLanguages = async () => {
    setStatusMessage("Deleting old data...");
    const currentLangs = await fetchLanguages(); // Get fresh list
    
    // Process deletions sequentially to avoid backend overload or race conditions
    for (const lang of currentLangs) {
        try {
            await request("/delete_language", "POST", { language_code: lang.language_code });
        } catch (e) {
            console.error(`Failed to delete ${lang.language_code}`, e);
        }
    }
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

    // 1. Validation Phase
    const headers = parseCSVLine(lines[0]);
    const codeIndex = headers.findIndex(h => h.toLowerCase() === "language_code");
    const nameIndex = headers.findIndex(h => h.toLowerCase() === "language_name");

    if (codeIndex === -1 || nameIndex === -1) {
      toast({ title: "Invalid Columns", description: "CSV must have 'language_code' and 'language_name'.", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    // 2. Wipe Phase (Delete all existing languages)
    await deleteAllExistingLanguages();

    // 3. Import Phase
    setStatusMessage("Importing new data...");
    let successCount = 0;
    const totalRows = lines.length - 1;

    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCSVLine(lines[i]);
      if (rowValues.length < 2) continue;

      const langCode = rowValues[codeIndex];
      const langName = rowValues[nameIndex];

      if (!langCode || !langName) continue;

      try {
        // Create Language
        await request("/create_language", "POST", {
          language_name: langName,
          language_code: langCode,
        });

        // Prepare Translations
        const transPayload: Record<string, string> = {};
        let hasTrans = false;

        PREDEFINED_KEYS.forEach(key => {
          const keyIndex = headers.indexOf(key);
          if (keyIndex !== -1 && rowValues[keyIndex]) {
            transPayload[key] = rowValues[keyIndex];
            hasTrans = true;
          }
        });

        // Save Translations
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

      setUploadProgress(Math.round((i / totalRows) * 100));
    }

    setIsUploading(false);
    setStatusMessage("");
    toast({ title: "Full Sync Complete", description: `Database replaced. Imported ${successCount} languages.` });
    fetchLanguages();
  };

  // --- Logic: Export Database to CSV ---
  const handleExportData = async () => {
    setIsExporting(true);
    try {
        const resLang = await request("/get_languages", "GET");
        let allLanguages = [];
        
        if (resLang?.status_code === 200 && Array.isArray(resLang.data)) {
            allLanguages = resLang.data;
        } else {
            toast({ title: "No languages found to export", variant: "destructive" });
            setIsExporting(false);
            return;
        }

        const headerRow = ["language_code", "language_name", ...PREDEFINED_KEYS];
        const escapeCsv = (val: string) => `"${(val || "").replace(/"/g, '""')}"`;

        let csvContent = headerRow.map(escapeCsv).join(",") + "\n";

        for (const lang of allLanguages) {
            const resTrans = await request("/get_language_translations", "POST", {
                language_code: lang.language_code
            });

            const translations = resTrans?.data || {};

            const rowData = [
                lang.language_code,
                lang.language_name,
                ...PREDEFINED_KEYS.map(key => translations[key] || "")
            ];

            csvContent += rowData.map(escapeCsv).join(",") + "\n";
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "languages_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Export Successful", description: "All database languages have been exported." });

    } catch (e) {
        console.error("Export failed", e);
        toast({ title: "Export Failed", description: "Could not fetch data.", variant: "destructive" });
    } finally {
        setIsExporting(false);
    }
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
                  {/* EXPORT BUTTON */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportData} 
                    disabled={isExporting || isUploading}
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    {isExporting ? "Exporting..." : "Export CSV"}
                  </Button>
                  
                  {/* IMPORT BUTTON */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isExporting}
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

          {/* Progress Bar & Status */}
          {isUploading && (
            <Card className="mb-6 bg-muted/20 border-primary/20">
              <CardContent className="py-4">
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="flex items-center">
                    {statusMessage === "Deleting old data..." && <AlertTriangle className="w-4 h-4 mr-2 text-amber-500"/>}
                    {statusMessage}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Please do not close this window.</p>
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
                      {(canDeleteLanguage || canEditLanguage) &&<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((language) => (
                      <tr key={language.language_code} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono">{language.language_code}</td>
                        <td className="py-3 px-4">{language.language_name}</td>
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
                        className="min-h-[2.5rem] py-2 resize-y text-sm border-gray focus:border-gray"
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