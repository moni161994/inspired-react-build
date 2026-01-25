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
import { Trash2, Edit3, Plus, Upload, FileDown, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Types ---
type Language = {
  language_code: string;
  language_name: string;
  is_active: boolean;
};

// --- CONSTANTS ---
const LANGUAGE_NAME_KEY = "_Language Name"; 

// 🎨 COLOR THEMES FOR CATEGORIES
const CATEGORY_COLORS: Record<string, { bg: string, border: string, text: string, badgeBg: string, badgeText: string }> = {
  "App Headings": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badgeBg: "bg-white", badgeText: "text-blue-700" },
  "App Other Text": { bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-800", badgeBg: "bg-white", badgeText: "text-slate-700" },
  "Alert & Other Messages": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", badgeBg: "bg-white", badgeText: "text-rose-700" },
  "Lead Contact fields": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", badgeBg: "bg-white", badgeText: "text-emerald-700" },
  "Lead Labels": { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", badgeBg: "bg-white", badgeText: "text-violet-700" },
  "Manual Lead form": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badgeBg: "bg-white", badgeText: "text-amber-700" },
  "Email Opt-in": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-800", badgeBg: "bg-white", badgeText: "text-cyan-700" },
  "Area of Interest": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", badgeBg: "bg-white", badgeText: "text-indigo-700" },
  "Uncategorized": { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", badgeBg: "bg-white", badgeText: "text-gray-700" }
};

const KEY_CATEGORIES: Record<string, string> = {
  "Dashboard": "App Headings",
  "Profile": "App Headings",
  "Leads": "App Headings",
  "Support": "App Headings",
  "Total Lead": "App Headings",
  "Logout": "App Headings",
  "New Lead Captured": "Alert & Other Messages",
  "CRM Sync Completed": "Alert & Other Messages",
  "CRM Sync": "Alert & Other Messages",
  "Hot Lead Identified": "Alert & Other Messages",
  "Hide Details": "App Headings",
  "Designation": "Lead Contact fields",
  "Company": "Lead Contact fields",
  "Phone Numbers": "Lead Contact fields",
  "Emails": "Lead Contact fields",
  "Websites": "Lead Contact fields",
  "Other": "Lead Contact fields",
  "City": "Lead Contact fields",
  "State": "Lead Contact fields",
  "ZIP": "Lead Contact fields",
  "Country": "Lead Contact fields",
  "Area Of Interest": "Lead Labels",
  "Disclaimer": "Lead Labels",
  "Consent Form": "Lead Labels",
  "Term And Condition": "Lead Labels",
  "Signature": "Lead Labels",
  "Email Opt In": "Lead Labels",
  "Captured by": "Lead Labels",
  "Support?": "App Headings",
  "How we can help you": "App Other Text",
  "For any queries or support": "App Other Text",
  "please email us at": "App Other Text",
  "FAQs": "App Other Text",
  "How can I contact support?": "App Other Text",
  "What should I include in my email?": "App Other Text",
  "What are your support hours?": "App Other Text",
  "My Profile": "App Headings",
  "Employee ID": "App Headings",
  "Teams": "App Headings",
  "Parent ID": "App Headings",
  "Status": "App Headings",
  "Active": "App Headings",
  "Total Leads": "App Headings",
  "Total Events": "App Headings",
  "Active Events": "App Headings",
  "Offline Leads": "App Headings",
  "Recent Activity": "App Headings",
  "All": "App Headings",
  "View All": "App Headings",
  "Add Lead Capture": "App Headings",
  "Select Event": "App Headings",
  "Photo": "App Headings",
  "Manual": "App Headings",
  "Click below to capture lead via camera": "App Other Text",
  "Take a Photo": "App Headings",
  "Lead Capture": "App Headings",
  "Badge Capture": "App Headings",
  "No Records Found": "App Other Text",
  "To get Started": "App Other Text",
  "Enter Your Install Code": "App Other Text",
  "Enter Install Code": "App Other Text",
  "Choose your Language": "App Headings",
  "Continue": "App Other Text",
  "Welcome Back": "App Other Text",
  "Email or Phone": "App Other Text",
  "Code": "App Other Text",
  "Submit": "App Other Text",
  "Error": "App Other Text",
  "Login Failed": "Alert & Other Messages",
  "Invalid credentials": "Alert & Other Messages",
  "Please enter email and 5 digit code": "Alert & Other Messages",
  "Something went wrong": "Alert & Other Messages",
  "Please enter your email": "App Other Text",
  "Failed to send OTP": "Alert & Other Messages",
  "Something went wrong while sending OTP": "Alert & Other Messages",
  "Selection Required": "Alert & Other Messages",
  "Please select a language to continue": "App Other Text",
  "Failed to load languages": "Alert & Other Messages",
  "Something went wrong fetching languages": "Alert & Other Messages",
  "Failed to download language pack. Please try again.": "Alert & Other Messages",
  "Check your internet connection and try again.": "Alert & Other Messages",
  "Hello,": "App Other Text",
  "User": "App Other Text",
  "Nothing to sync": "Alert & Other Messages",
  "Manual Lead": "App Headings",
  "Captured Lead": "App Headings",
  "Some Leads Not Synced": "Alert & Other Messages",
  "leads could not be synced.": "Alert & Other Messages",
  "Go to Pending": "App Headings",
  "All captured leads uploaded successfully!": "Alert & Other Messages",
  "Something went wrong while syncing captured leads.": "Alert & Other Messages",
  "New lead Capture": "App Headings",
  "New Leads in oﬄine mode": "App Headings",
  "New Leads in offline mode": "App Headings",
  "Need Sync": "App Headings",
  "New lead capture with Consent": "App Headings",
  "New event activated": "Alert & Other Messages",
  "Performance Overview": "App Headings",
  "Conversion Rate": "App Headings",
  "Sync Success": "Alert & Other Messages",
  "Activity History": "App Headings",
  "clicked": "App Other Text",
  "Confirm Delete": "App Other Text",
  "Are you sure you want to delete this event?": "Alert & Other Messages",
  "Delete": "App Other Text",
  "Cancel": "App Other Text",
  "Delete failed": "Alert & Other Messages",
  "Event updated successfully": "Alert & Other Messages",
  "Update failed": "Alert & Other Messages",
  "Event ID": "App Headings",
  "Priority": "App Headings",
  "Budget": "App Headings",
  "Size": "App Headings",
  "No records found": "App Other Text",
  "Notifications": "App Other Text",
  "Camera loading...": "App Other Text",
  "Offline Mode": "App Other Text",
  "Image saved locally. Fill details & submit to save complete lead offline.": "Alert & Other Messages",
  "Continue Offline": "App Other Text",
  "Pending Uploads": "App Other Text",
  "Upload failed": "Alert & Other Messages",
  "No QR code detected from Vision": "Alert & Other Messages",
  "Failed to capture photo": "Alert & Other Messages",
  "Failed to pick image": "Alert & Other Messages",
  "Gallery": "App Other Text",
  "Show Contact Details": "App Other Text",
  "Hide Contact Details": "App Other Text",
  "Contact Details": "App Other Text",
  "Other Details": "App Other Text",
  "QR Code": "App Headings",
  "Role": "App Headings",
  "Successful Upload": "Alert & Other Messages",
  "Captured on": "App Other Text",
  "Yes": "App Other Text",
  "No": "App Other Text",
  "Sync Offline": "App Headings",
  "Syncing...": "Alert & Other Messages",
  "Unknown Name": "Alert & Other Messages",
  "No email": "App Other Text",
  "No phone": "App Other Text",
  "Are you sure you want to delete this lead?": "App Other Text",
  "No active event found to sync this lead.": "Alert & Other Messages",
  "Lead synced & text extracted!": "Alert & Other Messages",
  "Could not sync lead, saved offline.": "Alert & Other Messages",
  "Check your internet connection. Lead saved offline.": "App Other Text",
  "No offline leads saved": "Alert & Other Messages",
  "Sync": "App Other Text",
  "Phone": "App Other Text",
  "Email": "App Other Text",
  "Delete Lead": "App Other Text",
  "All captured leads synced successfully!": "Alert & Other Messages",
  "Failed to sync captured leads.": "Alert & Other Messages",
  "Internet not available for sync.": "Alert & Other Messages",
  "OCR Failed": "Alert & Other Messages",
  "Please update your plan": "App Other Text",
  "Validation Error": "Alert & Other Messages",
  "Name is required for upload.": "Alert & Other Messages",
  "Lead synced successfully!": "Alert & Other Messages",
  "Sync Failed": "Alert & Other Messages",
  "Lead saved for retry.": "Alert & Other Messages",
  "Sync All": "App Other Text",
  "No offline leads": "App Other Text",
  "Lead Image": "App Other Text",
  "Pending": "App Other Text",
  "No existing field in this event template": "Alert & Other Messages",
  "Captured Photo": "App Other Text",
  "Lead Details": "App Other Text",
  "Enter Name": "Manual Lead form",
  "Enter Designation": "Manual Lead form",
  "Enter Company": "Manual Lead form",
  "Enter Phone": "Manual Lead form",
  "Enter Email": "Manual Lead form",
  "Enter Website": "Manual Lead form",
  "Enter Role (comma separated)": "Manual Lead form",
  "Enter / Edit QR Data": "Manual Lead form",
  "Enter Disclaimer": "Manual Lead form",
  "Enter City": "Manual Lead form",
  "Enter State": "Manual Lead form",
  "Enter Zip": "Manual Lead form",
  "Enter Country": "Manual Lead form",
  "Area of Interest - Category": "App Other Text",
  "Make a selection >": "App Other Text",
  "Add Signature": "App Other Text",
  "View >": "App Other Text",
  "Opted In": "App Other Text",
  "Opted Out": "App Other Text",
  "Data Consent": "App Other Text",
  "Consented": "App Other Text",
  "Declined": "App Other Text",
  "Terms & Conditions": "App Other Text",
  "Accepted": "Alert & Other Messages",
  "Submit Lead Capture": "App Other Text",
  "Submit Manual Form": "App Other Text",
  "Oops!": "App Other Text",
  "is mandatory. Please fill them.": "Alert & Other Messages",
  "are mandatory. Please fill them.": "Alert & Other Messages",
  "Invalid Email": "Alert & Other Messages",
  "Please enter a valid email (e.g., user@gmail.com)": "Alert & Other Messages",
  "Invalid Website": "Alert & Other Messages",
  "Please enter a valid website (e.g., www.example.com)": "Alert & Other Messages",
  "Invalid Phone": "Alert & Other Messages",
  "Phone number must be 10 digits": "Alert & Other Messages",
  "Saved Offline": "Alert & Other Messages",
  "Lead saved! Total pending:": "Alert & Other Messages",
  "Complete lead saved offline with all manual fields.": "Alert & Other Messages",
  "No speech detected, stopping mic safely": "Alert & Other Messages",
  "By entering your email address, you are Opting In to receive Marketing emails from Epredia.": "Email Opt-in",
  "This will allow us to digitally communicate with you via emails regarding products and services that we feel may be of interest to you or that are similar to those that you have already purchased or enquired about.": "Email Opt-in",
  "You may be contacted by us, or by one of our selected partners, in each case where you have consented to receive these communications.": "Email Opt-in",
  "You may opt out of receiving our marketing communications at any time by contacting us at privacy@epredia.com or by using the Unsubscribe link in any of our communications.": "Email Opt-in",
  "We will continue to contact you for non-marketing related purposes where we need to issue a field corrective or safety notice, or where we need to send certain information to you under a legal, regulatory, or ethical requirement.": "Email Opt-in",
  "Thank you.": "App Other Text",
  "Opt-In": "App Other Text",
  "Opt-Out": "App Other Text",
  "Done": "App Other Text",
  "Clear": "App Other Text",
  "Decline": "App Other Text",
  "Consent": "App Other Text",
  "Accept": "App Other Text",
  "I consent to the collection and processing of my personal data for this event.": "App Other Text",
  "This includes name, contact details, and professional information provided.": "App Other Text",
  "Data will be used for event follow-up and marketing communications (if opted in).": "App Other Text",
  "You may withdraw consent at privacy@epredia.com at any time.": "App Other Text",
  "By accepting these terms, you agree to our Terms & Conditions and Privacy Policy.": "App Other Text",
  "This will allow us to process your lead information securely and in compliance with data protection regulations.": "App Other Text",
  "You may review the full terms at any time by contacting privacy@epredia.com.": "App Other Text",
  "Anatomy Software": "Area of Interest",
  "Archiving & Storage": "Area of Interest",
  "Blades": "Area of Interest",
  "Cryotomy": "Area of Interest",
  "Cytology": "Area of Interest",
  "Digital Pathology": "Area of Interest",
  "Immunohistochemistry": "Area of Interest",
  "Instrument Service": "Area of Interest",
  "Labeling & Tracking": "Area of Interest",
  "Microscope Slides": "Area of Interest"
};

const PREDEFINED_KEYS = Object.keys(KEY_CATEGORIES);

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
  const [statusMessage, setStatusMessage] = useState(""); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { request, loading } = useApi();
  const { toast } = useToast();

  // --- Grouped Keys for Accordion ---
  const groupedKeys = PREDEFINED_KEYS.reduce((acc, key) => {
    const category = KEY_CATEGORIES[key] || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(key);
    return acc;
  }, {} as Record<string, string[]>);

  const SECTION_ORDER = [
    "App Headings",
    "App Other Text",
    "Alert & Other Messages",
    "Lead Contact fields",
    "Lead Labels",
    "Manual Lead form",
    "Email Opt-in",
    "Area of Interest",
    "Uncategorized"
  ];

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
        return formattedLanguages;
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

  // --- Logic: Bulk Import (COLUMN-BASED) ---
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

    if (!window.confirm("⚠️ WARNING: This will DELETE ALL existing languages and replace them with the CSV data. Continue?")) {
        event.target.value = ""; 
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) await processCSV(text);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const deleteAllExistingLanguages = async () => {
    setStatusMessage("Deleting old data...");
    const currentLangs = await fetchLanguages();
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
    
    if (lines.length < 3) {
      toast({ title: "Invalid Format", description: "CSV must have Header(Codes), Row 1(Names), and Data.", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    // 1. Parse Grid
    const grid = lines.map(line => parseCSVLine(line));

    // 2. Validate Structure
    // Row 0: "Translation Key", "en", "fr", ...
    // Row 1: "_Language Name", "English", "French", ...
    const headerCodes = grid[0]; 
    const headerNames = grid[1];

    if (headerNames[0] !== LANGUAGE_NAME_KEY) {
       toast({ title: "Invalid Format", description: `Row 2 cell 1 must be '${LANGUAGE_NAME_KEY}'`, variant: "destructive" });
       setIsUploading(false);
       return;
    }

    // Extract Languages (Skipping column 0 which is 'Key')
    const languagesToImport = [];
    for(let c = 1; c < headerCodes.length; c++) {
        const code = headerCodes[c];
        const name = headerNames[c];
        if(code && name) {
            languagesToImport.push({ code, name, translations: {} as Record<string,string> });
        }
    }

    if (languagesToImport.length === 0) {
        toast({ title: "No languages found", variant: "destructive" });
        setIsUploading(false);
        return;
    }

    // 3. Wipe Data
    await deleteAllExistingLanguages();

    // 4. Parse Translations (Row 2 to End)
    setStatusMessage("Processing matrix...");
    for(let r = 2; r < grid.length; r++) {
        const row = grid[r];
        const key = row[0];

        if(key && PREDEFINED_KEYS.includes(key)) {
            for(let c = 1; c < row.length; c++) {
                if(languagesToImport[c-1]) {
                    languagesToImport[c-1].translations[key] = row[c] || "";
                }
            }
        }
    }

    // 5. Upload to API
    setStatusMessage("Uploading languages...");
    let successCount = 0;
    
    for (let i = 0; i < languagesToImport.length; i++) {
        const lang = languagesToImport[i];
        try {
            await request("/create_language", "POST", {
                language_name: lang.name,
                language_code: lang.code,
            });

            await request("/save_language_translations", "POST", {
                language_code: lang.code,
                translations: lang.translations,
            });

            successCount++;
        } catch (err) {
            console.error(`Error importing ${lang.code}`, err);
        }
        setUploadProgress(Math.round(((i + 1) / languagesToImport.length) * 100));
    }

    setIsUploading(false);
    setStatusMessage("");
    toast({ title: "Import Complete", description: `Imported ${successCount} languages.` });
    fetchLanguages();
  };

  // --- Logic: Export Data (COLUMN-BASED) ---
  const handleExportData = async () => {
    setIsExporting(true);
    try {
        const resLang = await request("/get_languages", "GET");
        let allLanguages: any[] = [];
        
        if (resLang?.status_code === 200 && Array.isArray(resLang.data)) {
            allLanguages = resLang.data;
        } else {
            toast({ title: "No languages found", variant: "destructive" });
            setIsExporting(false);
            return;
        }

        const allTranslations: Record<string, any> = {};
        
        await Promise.all(allLanguages.map(async (lang) => {
            try {
                const tRes = await request("/get_language_translations", "POST", { language_code: lang.language_code });
                allTranslations[lang.language_code] = tRes?.data || {};
            } catch (e) {
                allTranslations[lang.language_code] = {};
            }
        }));

        const escapeCsv = (val: string) => `"${(val || "").replace(/"/g, '""')}"`;

        // Row 1: Header (Codes) -> "Translation Key", "en", "fr"
        let csvContent = `Translation Key,${allLanguages.map(l => escapeCsv(l.language_code)).join(",")}\n`;

        // Row 2: Metadata (Names) -> "_Language Name", "English", "French"
        csvContent += `${LANGUAGE_NAME_KEY},${allLanguages.map(l => escapeCsv(l.language_name)).join(",")}\n`;

        // Subsequent Rows: Keys and Values
        PREDEFINED_KEYS.forEach(key => {
            const rowValues = allLanguages.map(lang => {
                const val = allTranslations[lang.language_code]?.[key] || "";
                return escapeCsv(val);
            });
            csvContent += `${escapeCsv(key)},${rowValues.join(",")}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "languages_matrix_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Export Successful" });

    } catch (e) {
        console.error("Export failed", e);
        toast({ title: "Export Failed", variant: "destructive" });
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
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-lg font-semibold text-foreground">Languages</h2>
            
            <div className="flex flex-wrap gap-2">
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />

              {canCreateLanguage && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportData} 
                    disabled={isExporting || isUploading}
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    {isExporting ? "Exporting..." : "Export Matrix CSV"}
                  </Button>
                  
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

          {/* Progress */}
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

          {/* Table */}
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
            {/* General Settings */}
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
                </div>
              </div>
            </div>

            {/* Accordion Translations */}
            <h3 className="text-sm font-semibold text-foreground/80 mb-2">Translations</h3>
            
            <Accordion type="multiple" defaultValue={["App Headings"]} className="w-full space-y-2">
              {SECTION_ORDER.map((category) => {
                const keys = groupedKeys[category];
                if (!keys || keys.length === 0) return null;

                const theme = CATEGORY_COLORS[category] || CATEGORY_COLORS["Uncategorized"];

                return (
                  <AccordionItem 
                    key={category} 
                    value={category} 
                    className={`border rounded-lg overflow-hidden ${theme.border} ${theme.bg}`}
                  >
                    <AccordionTrigger className={`px-4 py-3 hover:opacity-90 transition-opacity ${theme.text}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{category}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs border-0 ${theme.badgeBg} ${theme.badgeText}`}
                        >
                          {keys.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-white border-t border-gray-100">
                      <div className="space-y-4">
                        {keys.map((key) => (
                          <div key={key} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <div className="md:col-span-4 pt-2">
                              <Label className="text-xs font-mono text-muted-foreground break-words leading-tight">
                                {key}
                              </Label>
                            </div>
                            <div className="md:col-span-8">
                              <Textarea
                                value={formData.translations[key] || ""}
                                onChange={(e) => updateTranslationKey(key, e.target.value)}
                                placeholder="Enter translation..."
                                className="min-h-[2.5rem] py-2 resize-y text-sm border-gray focus:border-gray"
                                rows={1}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
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