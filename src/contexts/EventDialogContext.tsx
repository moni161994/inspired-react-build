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
import { useToast } from "@/components/ui/use-toast";

type EventDialogContextType = {
  openEventDialog: () => void;
  closeEventDialog: () => void;
};

const EventDialogContext = createContext<EventDialogContextType | undefined>(
  undefined
);

export function EventDialogProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const [isOpen, setIsOpen] = useState(false);
  const { request } = useApi<any>();

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

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // ✅ Required field validation
    const requiredFields = [
      { field: "status", label: "Event Status" },
      { field: "team", label: "Team" },
      { field: "eventName", label: "Event Name" },
      { field: "startDate", label: "Start Date" },
      { field: "endDate", label: "End Date" },
      { field: "location", label: "Event Location" },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          variant: "destructive",
          title: "⚠️ Missing Required Field",
          description: `${label} is required.`,
        });
        return;
      }
    }

    // ✅ Date validation
    if (formData.startDate < today || formData.endDate < today) {
      toast({
        variant: "destructive",
        title: "❌ Invalid Date",
        description: "Start and End dates cannot be earlier than today.",
      });
      return;
    }

    if (formData.endDate < formData.startDate) {
      toast({
        variant: "destructive",
        title: "⚠️ Invalid Range",
        description: "End date cannot be before the start date.",
      });
      return;
    }

    // ✅ API request
    const res = await request("/create_events", "POST", {
      event_status: formData.status,
      event_name: formData.eventName,
      start_date: formData.startDate,
      end_date: formData.endDate,
      location: formData.location,
      team: formData.team,
      total_leads: formData.totalLeads,
      priority_leads: formData.priorityLeads,
      budget: formData.budget,
      event_size: formData.eventSize,
    });

    // ✅ Toast feedback
    if (res?.message === "Event updated successfully") {
      toast({
        title: "✅ Event Created",
        description: "Your event has been created successfully.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "❌ Failed",
        description: res?.msg || "Failed to submit the details.",
      });
    }

    closeEventDialog();
  };

  const openEventDialog = () => setIsOpen(true);
  const closeEventDialog = () => setIsOpen(false);

  return (
    <EventDialogContext.Provider value={{ openEventDialog, closeEventDialog }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create a New Event</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* Event Status */}
            <div>
              <Label>Event Status *</Label>
              <Select
                defaultValue="Upcoming"
                onValueChange={(val) => handleSelectChange("status", val)}
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

            {/* Select Team */}
            <div>
              <Label>Select Team *</Label>
              <Select onValueChange={(val) => handleSelectChange("team", val)}>
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
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="Enter event name"
                onChange={handleChange}
              />
            </div>

            {/* Event Size */}
            <div>
              <Label htmlFor="eventSize">Event Size</Label>
              <Select
                onValueChange={(val) => handleSelectChange("eventSize", val)}
              >
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

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" min={today} onChange={handleChange} />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" type="date" min={today} onChange={handleChange} />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Event Location *</Label>
              <Input
                id="location"
                placeholder="Enter location"
                onChange={handleChange}
              />
            </div>

            {/* Budget */}
            <div>
              <Label htmlFor="budget">Approximate Budget (USD)</Label>
              <Input id="budget" type="number" placeholder="0" onChange={handleChange} />
            </div>

            {/* Total Leads */}
            <div>
              <Label htmlFor="totalLeads">Total Leads</Label>
              <Input id="totalLeads" type="number" placeholder="0" onChange={handleChange} />
            </div>

            {/* Priority Leads */}
            <div>
              <Label htmlFor="priorityLeads">Priority Leads</Label>
              <Input id="priorityLeads" type="number" placeholder="0" onChange={handleChange} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-2 pt-6">
            <Button variant="outline" onClick={closeEventDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Create Event
            </Button>
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
