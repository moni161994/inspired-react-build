import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 py-1 px-3">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const plans = [
  { title: 'Plan Name', value: 'Eprevent Unlimited (Expired)' },
  { title: 'Start Date', value: '06/07/2024' },
  { title: 'Teams Included', value: '0' },
  { title: 'Business Card Transcriptions', value: '0 of 1,000' },
  { title: 'End Date', value: '06/06/2025' },
  { title: 'Device Licenses', value: '0' },
  { title: 'Status', value: 'Active', isBadge: true },
]

export function AccountSummary() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Account Summary</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th colSpan={2} className="text-left py-3 px-4 text-xl font-medium text-black">Plan Details</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => {
                  return (
                    <tr key={index} className="border-b hover:bg-muted/20">
                      <td className="py-3 px-4 text-muted-foreground">{plan.title}</td>
                      <td className="py-3 px-4 text-right text-foreground">{plan?.isBadge ? getStatusBadge(plan.value) : plan.value}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}