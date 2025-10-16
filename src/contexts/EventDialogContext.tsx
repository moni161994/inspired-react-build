import { createContext, useContext, useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";

type EventDialogContextType = {
  openEventDialog: () => void;
  closeEventDialog: () => void;
};

const EventDialogContext = createContext<EventDialogContextType | undefined>(
  undefined
);

export function EventDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { request, loading, error } = useApi<any>();
  // ✅ Centralized Form State
  const [formData, setFormData] = useState({
    status: "Upcoming",
    team: "",
    eventName: "",
    startDate: "",
    endDate: "",
    location: "",
    totalLeads: 0,
    priorityLeads: 0,
    budget: 0,
    eventSize: "",
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async () => {
    const res = await request("/create_events", "POST", {
      event_status:formData.status,
      event_name:formData.eventName,
      start_date:formData.startDate,
      end_date:formData.endDate,
      location:formData.location,
      team:formData.team,
      total_leads:formData.totalLeads,
      priority_leads:formData.priorityLeads,
      budget:formData.budget,
      event_size: formData.eventSize
    });

    if (res?.message === 'Event updated successfully') {
      alert("Event Created");
    } else {
      alert(res?.msg || "Failed to submit the details");
    }
    closeEventDialog();
  };

  const openEventDialog = () => setIsOpen(true);
  const closeEventDialog = () => setIsOpen(false);

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a New Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Status */}
            <div>
              <Label>Event Status *</Label>
              <Select
                defaultValue="Upcoming"
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team */}
            <div>
              <Label>Select Team *</Label>
              <Select onValueChange={(v) => handleChange("team", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epredia">epredia</SelectItem>
                  <SelectItem value="Eprevent">Eprevent</SelectItem>
                  <SelectItem value="phc">PHC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Name */}
            <div>
              <Label>Event Name *</Label>
              <Input
                placeholder="Enter event name"
                onChange={(e) => handleChange("eventName", e.target.value)}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" onChange={(e) => handleChange("startDate", e.target.value)} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" onChange={(e) => handleChange("endDate", e.target.value)} />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label>Event Location *</Label>
              <Input
                placeholder="Enter location"
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>

            {/* Leads */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Leads</Label>
                <Input
                  type="number"
                  defaultValue={0}
                  onChange={(e) => handleChange("totalLeads", Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Priority Leads</Label>
                <Input
                  type="number"
                  defaultValue={0}
                  onChange={(e) => handleChange("priorityLeads", Number(e.target.value))}
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <Label>Approximate Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  className="pl-6"
                  placeholder="0"
                  onChange={(e) => handleChange("budget", Number(e.target.value))}
                />
              </div>
            </div>

            {/* Event Size */}
            <div>
              <Label>Event Size</Label>
              <Select onValueChange={(v) => handleChange("eventSize", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Event Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={closeEventDialog}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit}>Create Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </EventDialogContext.Provider>
  );
}

export function useEventDialog() {
  const context = useContext(EventDialogContext);
  if (context === undefined) {
    throw new Error("useEventDialog must be used within an EventDialogProvider");
  }
  return context;
}
