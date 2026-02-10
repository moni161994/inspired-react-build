import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

type OptInItem = {
  template_id: number;
  is_mandatory: boolean;
};

interface EventOptInSelectorProps {
  // Pass existing selections if editing an event
  value?: OptInItem[]; 
  // Callback when user changes selection
  onChange: (selected: OptInItem[]) => void; 
}

export function EventOptInSelector({ value = [], onChange }: EventOptInSelectorProps) {
  const { request, loading } = useApi<any>();
  const [library, setLibrary] = useState<any[]>([]);

  // Local state to manage selections before passing up
  const [selections, setSelections] = useState<OptInItem[]>(value);

  useEffect(() => {
    // Fetch the Master Library we created in Step 1
    const fetchLib = async () => {
        const res = await request("/admin/templates", "GET");
        if(res && (Array.isArray(res) || Array.isArray(res.data))) {
            setLibrary(Array.isArray(res) ? res : res.data);
        }
    };
    fetchLib();
  }, []);

  // Update parent when local state changes
  useEffect(() => {
    onChange(selections);
  }, [selections]);

  const toggleSelection = (id: number) => {
    setSelections((prev) => {
      const exists = prev.find((item) => item.template_id === id);
      if (exists) {
        // Remove
        return prev.filter((item) => item.template_id !== id);
      } else {
        // Add (default mandatory: false)
        return [...prev, { template_id: id, is_mandatory: false }];
      }
    });
  };

  const toggleMandatory = (id: number) => {
    setSelections((prev) => 
        prev.map((item) => 
            item.template_id === id ? { ...item, is_mandatory: !item.is_mandatory } : item
        )
    );
  };

  if (loading && library.length === 0) {
    return <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  }

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <h3 className="text-sm font-semibold mb-3">Configure Email Opt-Ins</h3>
      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
        {library.map((tpl) => {
          const selection = selections.find((s) => s.template_id === tpl.id);
          const isSelected = !!selection;

          return (
            <div
              key={tpl.id}
              className={`flex items-start justify-between border p-3 rounded-md transition-all ${
                isSelected ? "bg-white border-primary shadow-sm" : "bg-white border-input hover:bg-slate-100"
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(tpl.id)}
                  className="mt-1"
                />
                <div className="grid gap-1.5">
                    <span className="font-medium text-sm leading-none">{tpl.title}</span>
                    <div 
                        className="text-xs text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{__html: tpl.content}}
                    />
                </div>
              </div>

              {isSelected && (
                <div className="flex flex-col items-end gap-2 pl-4 border-l ml-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase ${selection.is_mandatory ? "text-red-500" : "text-muted-foreground"}`}>
                            {selection.is_mandatory ? "Required" : "Optional"}
                        </span>
                        <Switch 
                            checked={selection.is_mandatory} 
                            onCheckedChange={() => toggleMandatory(tpl.id)} 
                            className="scale-75"
                        />
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {library.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No opt-in templates found. Create them in Settings.</p>
      )}
    </div>
  );
}