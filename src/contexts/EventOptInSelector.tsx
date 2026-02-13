import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
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

  // Local state to manage selections
  const [selections, setSelections] = useState<OptInItem[]>(value);

  useEffect(() => {
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

  const handleToggleSelection = (id: number) => {
    setSelections((prev) => {
      const isCurrentlySelected = prev.some((item) => item.template_id === id);
      
      if (isCurrentlySelected) {
        // If clicking the one already selected, deselect it
        return [];
      } else {
        // Otherwise, replace selection with this ID and force mandatory to TRUE
        return [{ template_id: id, is_mandatory: true }];
      }
    });
  };

  if (loading && library.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Select Email Opt-In Template</h3>
        <span className="text-[10px] text-muted-foreground italic">* Only one may be selected</span>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
        {library.map((tpl) => {
          // Check if this specific template is the one in our single-item array
          const selection = selections.find((s) => s.template_id === tpl.id);
          const isSelected = !!selection;

          return (
            <div
              key={tpl.id}
              className={`flex items-start justify-between border p-3 rounded-md transition-all ${
                isSelected 
                  ? "bg-white border-primary shadow-sm ring-1 ring-primary/20" 
                  : "bg-white border-input hover:bg-slate-100"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => handleToggleSelection(tpl.id)}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleSelection(tpl.id)}
                  className="mt-1 rounded-full"
                />
                <div className="grid gap-1.5">
                    <span className={`font-medium text-sm leading-none ${isSelected ? "text-primary" : ""}`}>
                        {tpl.title}
                    </span>
                    <div 
                        className="text-xs text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{__html: tpl.content}}
                    />
                </div>
              </div>

              {isSelected && (
                <div className="flex flex-col items-end gap-2 pl-4 border-l ml-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                            Required
                        </span>
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