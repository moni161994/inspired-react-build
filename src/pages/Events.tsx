import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, List } from "lucide-react";

import { useApi } from "@/hooks/useApi";

type Event = {
  event_status: string;
  event_name: string;
  start_date: string;
  end_date: string;
  location: string;
  team: string;
  total_leads: number;
  priority_leads: number;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Upcoming":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">
          Upcoming
        </Badge>
      );
    case "In progress":
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100/80">
          In progress
        </Badge>
      );
    case "Completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">
          Completed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function Events() {
  const { request, loading, error } = useApi<Event[]>();
  const [events, setEvents] = useState<Event[]>([]);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await request("/get_all_event_details", "GET");
      if (data) {
        setEvents(data);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Your Events
            </h1>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select defaultValue="all-teams">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-teams">All Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select defaultValue="all-statuses">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">
                    All Event Statuses
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>

              <Button className="bg-primary hover:bg-primary/90">
                <List className="w-4 h-4 mr-2" />
                List View
              </Button>
            </div>
          </div>

          {loading && <p>Loading events...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Event Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Event Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Start & End Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Team
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Total Leads
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Priority Leads
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20">
                        <td className="py-3 px-4">{getStatusBadge(event.event_status)}</td>
                        <td className="py-3 px-4 text-foreground">
                          {event.event_name}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {event.start_date} -  {event.end_date}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {event.location}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                event.team === "epredia"
                                  ? "bg-gray-400"
                                  : "bg-purple-400"
                              }`}
                            ></div>
                            <span className="text-foreground">{event.team}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {event.total_leads}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {event.priority_leads}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={isCreateEventOpen}
            onOpenChange={setIsCreateEventOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create a New Event</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="select-team">Select Team *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="epredia">epredia</SelectItem>
                      <SelectItem value="phc">PHC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event-name">Event Name *</Label>
                  <Input id="event-name" />
                </div>

                <div>
                  <Label htmlFor="event-dates">Event Dates *</Label>
                  <Input
                    id="event-dates"
                    placeholder="Select Start - End Date"
                  />
                </div>

                <div>
                  <Label htmlFor="event-location">Event Location *</Label>
                  <Input id="event-location" />
                </div>

                <div>
                  <Label htmlFor="event-contact">Event Contact *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact1">Contact 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget">Approximate Budget (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input id="budget" className="pl-6" />
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

                <div className="flex items-center space-x-2">
                  <Checkbox id="test-event" />
                  <Label htmlFor="test-event">This is a test event</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateEventOpen(false)}>
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
