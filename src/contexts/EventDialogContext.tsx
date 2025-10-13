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

type EventDialogContextType = {
  openEventDialog: () => void;
  closeEventDialog: () => void;
};

const EventDialogContext = createContext<EventDialogContextType | undefined>(
  undefined
);

export function EventDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

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
            <div>
              <Label htmlFor="event-status">Event Status *</Label>
              <Select defaultValue="Upcoming">
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

            <div>
              <Label htmlFor="select-team">Select Team *</Label>
              <Select>
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

            <div>
              <Label htmlFor="event-name">Event Name *</Label>
              <Input id="event-name" placeholder="Enter event name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date *</Label>
                <Input id="start-date" type="date" />
              </div>
              <div>
                <Label htmlFor="end-date">End Date *</Label>
                <Input id="end-date" type="date" />
              </div>
            </div>

            <div>
              <Label htmlFor="event-location">Event Location *</Label>
              <Input id="event-location" placeholder="Enter location" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total-leads">Total Leads</Label>
                <Input id="total-leads" type="number" defaultValue={0} />
              </div>
              <div>
                <Label htmlFor="priority-leads">Priority Leads</Label>
                <Input id="priority-leads" type="number" defaultValue={0} />
              </div>
            </div>

            <div>
              <Label htmlFor="budget">Approximate Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input id="budget" type="number" className="pl-6" placeholder="0" />
              </div>
            </div>

            <div>
              <Label htmlFor="event-size">Event Size</Label>
              <Select>
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={closeEventDialog}>
                Cancel
              </Button>
              <Button onClick={closeEventDialog}>
                Create Event
              </Button>
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
