import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EventDialogProvider } from "@/contexts/EventDialogContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Events from "./pages/Events";
import Teams from "./pages/Teams";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "../src/components/protectedRoute";
import TeamAnalytics from "./pages/TeamAna";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Templates from "./pages/Templates";
import LanguageManagement from "./pages/Language";
import AreaOfInterestManagement from "./pages/AreaOfIntrest";
import { useEffect } from "react";
import OptInLibrary from "./pages/OptInLibrary";

const queryClient = new QueryClient();


const App = () => 
  {
    useEffect(() => {
      // 1. Disable Right Click
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };
  
      // 2. Disable Keyboard Shortcuts (Inspect, View Source, Save)
      const handleKeyDown = (e: KeyboardEvent) => {
        // Disable F12, Ctrl + Shift + I, Ctrl + Shift + J, Ctrl + U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.key === 'U') ||
          (e.ctrlKey && e.key === 'S') // Optional: Disable Save
        ) {
          e.preventDefault();
        }
      };
  
      // Add Event Listeners
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
  
      // Cleanup Listeners on Unmount
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);
    return (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EventDialogProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* protected routes */}
            <Route path="/" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamAnalytics /></ProtectedRoute>} />
            <Route path="/lead" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="/language" element={<ProtectedRoute><LanguageManagement /></ProtectedRoute>} />
            <Route path="/areaofintrest" element={<ProtectedRoute><AreaOfInterestManagement /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/template" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/opt-in" element={<ProtectedRoute><OptInLibrary /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </EventDialogProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);}


export default App;
