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
import Analytics from "./pages/Analytics";
import Teams from "./pages/Teams";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "../src/components/protectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EventDialogProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </EventDialogProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
