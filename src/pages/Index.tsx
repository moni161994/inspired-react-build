import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AccountSummary } from "@/components/AccountSummary";

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto">
          <AccountSummary />
        </main>
      </div>
    </div>
  );
};

export default Index;