import { Search, Plus, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-foreground">epredia • KT</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Team Search..."
            className="w-64 pl-10 bg-background border-border"
          />
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add New Event
        </Button>
        
        <Button asChild variant="outline">
          <Link to="/login">
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Link>
        </Button>
      </div>
    </header>
  );
}