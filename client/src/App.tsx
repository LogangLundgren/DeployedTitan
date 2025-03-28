import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import WorkoutLogger from "@/pages/WorkoutLogger";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/workouts" component={WorkoutLogger} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
