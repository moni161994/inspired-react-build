import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, Edit3 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

type Language = {
  language_code: string;
  language_name: string;
  is_active: boolean;
};

type TranslationEntry = {
  key: string;
  value: string;
};

type LanguageTranslation = {
  language_code: string;
  translations: Record<string, string>;
};

// Predefined translation keys
// Updated PREDEFINED_KEYS with ALL screens scanned 👇

const PREDEFINED_KEYS = [
  // Original
  "Dashboard",
  "Profile", 
  "Leads",
  "Support",
  "Total Lead",
  "Logout",
  
  // NEW from Notifications Screen
  "New Lead Captured",
  "CRM Sync Completed",
  "CRM Sync",
  "Hot Lead Identified",
  
  // NEW from Lead Details Screen  
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
  
  // NEW from Support Screen
  "Support?",
  "How we can help you",
  "For any queries or support",
  "please email us at",
  "FAQs",
  "How can I contact support?",
  "What should I include in my email?",
  "What are your support hours?",
  
  // NEW from Profile Screen
  "My Profile",
  "Employee ID",
  "Teams",
  "Parent ID",
  "Status",
  "Active",
  
  // NEW from Dashboard Summary
  "Total Leads",
  "Total Events",
  "Active Events",
  "Offline Leads",
  "Recent Activity",
  "All",
  "View All",
  
  // NEW from Add Lead Capture Screen
  "Add Lead Capture",
  "Select Event",
  "Photo",
  "Manual",
  "Click below to capture lead via camera",
  "Take a Photo",
  
  // NEW from Leads Screen
  "Lead Capture", 
  "Badge Capture",
  "No Records Found"
] as const;


export default function LanguageManagement() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageTranslation | null>(null);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [editLanguageDialogOpen, setEditLanguageDialogOpen] = useState(false);
  const [editLanguageObj, setEditLanguageObj] = useState<Language | null>(null);
  const [myAccess, setMyAccess] = useState<any>(null);
  const [canCreateLanguage, setCanCreateLanguage] = useState(false);
  const [canEditLanguage, setCanEditLanguage] = useState(false);
  const [canEditTranslation, setCanEditTranslation] = useState(false);
  const [canDeleteLanguage, setCanDeleteLanguage] = useState(false);
  const [formData, setFormData] = useState({
    language_name: "",
    language_code: "",
  });

  const [translationEntries, setTranslationEntries] = useState<TranslationEntry[]>([]);
  const [showAllKeys, setShowAllKeys] = useState(false);

  const { request, loading } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    loadMyAccess(); 
    fetchLanguages();
  }, []);

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
        setCanEditTranslation(hasPage("/language") && hasAction("/language", "edit_transation"));
        setCanDeleteLanguage(hasPage("/language") && hasAction("/language", "delete_language"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
      setCanCreateLanguage(false);
      setCanEditLanguage(false);
      setCanEditTranslation(false);
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
        toast({
          title: "Failed to load languages",
          description: res?.error || "Could not fetch language data from server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('fetchLanguages error:', error);
      setLanguages([]);
      toast({
        title: "Failed to load languages",
        description: "Network error occurred.",
        variant: "destructive",
      });
    }
  };

  const openLanguageDialog = (language?: Language) => {
    setLanguageDialogOpen(true);
    setEditLanguageObj(language || null);
    if (language) {
      setFormData({
        language_name: language.language_name,
        language_code: language.language_code,
      });
    } else {
      setFormData({ language_name: "", language_code: "" });
    }
  };

  const handleCreateOrUpdateLanguage = async () => {
    if (!formData.language_name.trim() || !formData.language_code.trim()) {
      toast({ title: "Language name and code are required", variant: "destructive" });
      return;
    }

    let res;
    if (editLanguageObj) {
      res = await request("/update_language", "POST", {
        language_id: editLanguageObj.language_code,
        language_name: formData.language_name,
        language_code: formData.language_code,
      });
    } else {
      res = await request("/create_language", "POST", formData);
    }

    if (res?.status_code === 200 || res?.status_code === 201) {
      toast({ title: editLanguageObj ? "Language updated" : "Language created" });
      setLanguageDialogOpen(false);
      setEditLanguageObj(null);
      fetchLanguages();
    } else {
      toast({
        title: "Operation failed",
        description: res?.error || "Server error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLanguage = async (languageCode: string) => {
    const res = await request("/delete_language", "POST", { language_code: languageCode });
    if (res?.status_code === 200) {
      toast({ title: "Language deleted successfully" });
      fetchLanguages();
    } else {
      toast({
        title: "Delete failed",
        description: res?.error || "Could not delete language",
        variant: "destructive",
      });
    }
  };

  const openTranslationEditor = async (language: Language) => {
    const res = await request("/get_language_translations", "POST", {
      language_code: language.language_code,
    });
    
    if (res?.status_code === 200 && res.data) {
      // Initialize all predefined keys with existing translations or empty strings
      const initializedTranslations: Record<string, string> = {};
      
      PREDEFINED_KEYS.forEach(key => {
        initializedTranslations[key] = res.data[key] || "";
      });

      const entries: TranslationEntry[] = PREDEFINED_KEYS.map(key => ({
        key,
        value: initializedTranslations[key],
      }));

      setTranslationEntries(entries);
      setSelectedLanguage({
        language_code: language.language_code,
        translations: initializedTranslations,
      });
    } else {
      // No existing translations, initialize with all predefined keys
      const initializedTranslations: Record<string, string> = {};
      PREDEFINED_KEYS.forEach(key => {
        initializedTranslations[key] = "";
      });

      const entries: TranslationEntry[] = PREDEFINED_KEYS.map(key => ({
        key,
        value: "",
      }));

      setTranslationEntries(entries);
      setSelectedLanguage({
        language_code: language.language_code,
        translations: initializedTranslations,
      });
    }
    setEditLanguageDialogOpen(true);
  };

  const updateTranslation = (index: number, value: string) => {
    const updated = [...translationEntries];
    updated[index] = { ...updated[index], value };
    setTranslationEntries(updated);

    if (selectedLanguage) {
      setSelectedLanguage({
        ...selectedLanguage,
        translations: {
          ...selectedLanguage.translations,
          [updated[index].key]: value,
        },
      });
    }
  };

  const saveTranslations = async () => {
    const res = await request("/save_language_translations", "POST", {
      language_code: selectedLanguage?.language_code,
      translations: selectedLanguage?.translations,
    });

    if (res?.success || res?.status_code === 200) {
      toast({ title: "Translations saved successfully" });
      setEditLanguageDialogOpen(false);
      setTranslationEntries([]);
      setSelectedLanguage(null);
    } else {
      toast({
        title: "Save failed",
        description: res?.msg || res?.error || "Could not save translations",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Languages</h2>
            {canCreateLanguage && <Button onClick={() => openLanguageDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Language
            </Button>}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Language Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((language) => (
                      <tr key={language.language_code} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono">{language.language_code}</td>
                        <td className="py-3 px-4">{language.language_name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={language.is_active ? "default" : "secondary"}>
                            {language.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          {canEditTranslation && 
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openTranslationEditor(language)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Translations
                          </Button>}
                          {canEditLanguage && 
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openLanguageDialog(language)}
                          >
                            Edit
                          </Button>}
                          {canDeleteLanguage && <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteLanguage(language.language_code)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>}
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

      {/* Language Create/Edit Dialog */}
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editLanguageObj ? "Edit Language" : "Create New Language"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="language_name">Language Name *</Label>
              <Input
                id="language_name"
                placeholder="English"
                value={formData.language_name}
                onChange={(e) => setFormData({ ...formData, language_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="language_code">Language Code *</Label>
              <Input
                id="language_code"
                placeholder="en"
                value={formData.language_code}
                onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-6">
            <Button variant="outline" onClick={() => setLanguageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdateLanguage} disabled={loading}>
              {loading ? "Saving..." : editLanguageObj ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Translation Editor Dialog */}
      <Dialog open={editLanguageDialogOpen} onOpenChange={setEditLanguageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedLanguage?.language_code.toUpperCase()} - Translation Editor
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 mt-4 p-2">
            <div className="grid gap-4">
              {translationEntries.map((entry, index) => (
                <div key={entry.key} className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  {/* Fixed Key - Readonly */}
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-28">
                      <Label className="text-sm font-mono text-muted-foreground block mb-1">
                        {entry.key}
                      </Label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Translation:
                      </Label>
                      <Textarea
                        value={entry.value}
                        onChange={(e) => updateTranslation(index, e.target.value)}
                        placeholder={`Enter ${entry.key} translation...`}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditLanguageDialogOpen(false);
                setTranslationEntries([]);
                setSelectedLanguage(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveTranslations} disabled={loading}>
              {loading ? "Saving..." : "Save All Translations"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
