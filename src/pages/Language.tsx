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
import { X, Plus, Trash2 } from "lucide-react";
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

export default function LanguageManagement() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageTranslation | null>(null);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [editLanguageDialogOpen, setEditLanguageDialogOpen] = useState(false);
  const [editLanguageObj, setEditLanguageObj] = useState<Language | null>(null);

  const [formData, setFormData] = useState({
    language_name: "",
    language_code: "",
  });

  const [translationEntries, setTranslationEntries] = useState<TranslationEntry[]>([]);
  const [newTranslationKey, setNewTranslationKey] = useState("");
  const [newTranslationValue, setNewTranslationValue] = useState("");

  const { request, loading } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    fetchLanguages();
  }, []);

 const fetchLanguages = async () => {
  try {
    const res = await request("/get_languages", "GET");
    
    // Handle your API response format: { status_code: 200, data: [...] }
    if (res?.status_code === 200 && Array.isArray(res.data)) {
      // Convert is_active from 1/0 to boolean
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

  // Check your API response format
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
    const entries: TranslationEntry[] = Object.entries(res.data).map(([key, value]) => ({
      key,
      value: value as string,
    }));
    setTranslationEntries(entries);
    
    setSelectedLanguage({
      language_code: language.language_code,
      translations: res.data,
    });
  } else {
    setTranslationEntries([]);
    setSelectedLanguage({
      language_code: language.language_code,
      translations: {},
    });
  }
  setEditLanguageDialogOpen(true);
};


  const addTranslationEntry = () => {
    if (newTranslationKey.trim() && newTranslationValue.trim()) {
      const newEntry: TranslationEntry = {
        key: newTranslationKey.trim(),
        value: newTranslationValue.trim(),
      };
      setTranslationEntries([...translationEntries, newEntry]);
      
      setSelectedLanguage?.((prev) => prev ? {
        ...prev,
        translations: {
          ...prev.translations,
          [newTranslationKey.trim()]: newTranslationValue.trim(),
        },
      } : null);
      
      setNewTranslationKey("");
      setNewTranslationValue("");
    }
  };

  const updateTranslation = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...translationEntries];
    updated[index] = { ...updated[index], [field]: value };
    setTranslationEntries(updated);

    // Update selectedLanguage translations
    if (selectedLanguage) {
      const newTranslations = { ...selectedLanguage.translations };
      // Remove old key if key changed
      if (field === 'key' && updated[index].key !== value) {
        Object.keys(newTranslations).forEach((k) => {
          if (k === updated[index].key) delete newTranslations[k];
        });
      }
      newTranslations[value] = updated[index].value;
      setSelectedLanguage({
        ...selectedLanguage,
        translations: newTranslations,
      });
    }
  };

  const deleteTranslationEntry = (index: number) => {
    const updated = translationEntries.filter((_, i) => i !== index);
    setTranslationEntries(updated);

    if (selectedLanguage) {
      const newTranslations = { ...selectedLanguage.translations };
      delete newTranslations[translationEntries[index].key];
      setSelectedLanguage({
        ...selectedLanguage,
        translations: newTranslations,
      });
    }
  };

  const saveTranslations = async () => {
    const res = await request("/save_language_translations", "POST", {
      language_code: selectedLanguage?.language_code,
      translations: selectedLanguage?.translations,
    });

    if (res?.success) {
      toast({ title: "Translations saved successfully" });
      setEditLanguageDialogOpen(false);
      setTranslationEntries([]);
      setSelectedLanguage(null);
    } else {
      toast({
        title: "Save failed",
        description: res?.msg || "Could not save translations",
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
            <Button onClick={() => openLanguageDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Language
            </Button>
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openTranslationEditor(language)}
                          >
                            Edit Translations
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openLanguageDialog(language)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteLanguage(language.language_code)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedLanguage?.language_code.toUpperCase()} Translations
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Add New Translation */}
            <div className="flex space-x-2">
              <Input
                placeholder="Translation Key (e.g., Login)"
                value={newTranslationKey}
                onChange={(e) => setNewTranslationKey(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Translation Value"
                value={newTranslationValue}
                onChange={(e) => setNewTranslationValue(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addTranslationEntry} size="sm">
                Add
              </Button>
            </div>

            {/* Translation Entries */}
            <div className="space-y-2">
              {translationEntries.map((entry, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1 space-y-1">
                    <Input
                      value={entry.key}
                      onChange={(e) => updateTranslation(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="font-mono"
                    />
                    <Textarea
                      value={entry.value}
                      onChange={(e) => updateTranslation(index, 'value', e.target.value)}
                      placeholder="Translation value"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTranslationEntry(index)}
                    className="mt-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setEditLanguageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTranslations} disabled={loading}>
              {loading ? "Saving..." : "Save Translations"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
