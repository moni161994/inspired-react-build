import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AccountSummary() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Account Summary</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Plan Name</div>
              <div className="text-foreground">iCapture Unlimited (Expired)</div>
            </div>
            
            <div className="flex justify-end">
              <Badge variant="success">Active</Badge>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Start Date</div>
              <div className="text-foreground">06/07/2024</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">End Date</div>
              <div className="text-foreground">06/06/2025</div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Teams Included</div>
              <div className="text-foreground">0</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Device Licenses</div>
              <div className="text-foreground">0</div>
            </div>
            
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground mb-1">Business Card Transcriptions</div>
              <div className="text-foreground">0 of 1,000</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Add-ons</h2>
        <div className="text-sm text-muted-foreground">
          Searching "All Mailboxes"
        </div>
      </div>
    </div>
  );
}