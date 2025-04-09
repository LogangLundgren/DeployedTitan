import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import WorkoutLogger from "@/pages/WorkoutLogger";
import Templates from "@/pages/Templates";
import TemplateDetail from "@/pages/TemplateDetail";
import Profile from "@/pages/Profile";
import Goals from "@/pages/Goals";
import Social from "@/pages/Social";
import Marketplace from "@/pages/Marketplace";
import WorkoutPlanDetail from "@/pages/WorkoutPlanDetail";
import CoachProfile from "@/pages/CoachProfile";
import MyPlans from "@/pages/MyPlans";
import BecomeCoach from "@/pages/BecomeCoach";
import CreatePlan from "@/pages/CreatePlan";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import { NotificationsProvider } from "./context/NotificationsContext";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

function Router() {
  // Demo user data with all required fields from the schema
  const demoUser: User = {
    id: 1,
    username: 'demo',
    name: 'John Smith',
    email: 'demo@example.com',
    password: '',
    bio: null,
    location: null,
    fitnessLevel: null,
    experienceYears: null,
    goals: null,
    certifications: null,
    socialMedia: null
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationsProvider userId={demoUser.id}>
        <Header />
        <Navigation />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/workouts" component={WorkoutLogger} />
          <Route path="/templates" component={Templates} />
          <Route path="/templates/:id" component={TemplateDetail} />
          <Route path="/profile" component={Profile} />
          <Route path="/goals" component={Goals} />
          <Route path="/social" component={Social} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/workout-plans/:id" component={WorkoutPlanDetail} />
          <Route path="/coaches/:id" component={CoachProfile} />
          <Route path="/my-plans" component={MyPlans} />
          <Route path="/become-coach" component={BecomeCoach} />
          <Route path="/create-plan" component={CreatePlan} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/payment-success" component={PaymentSuccess} />
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
        <Footer />
      </NotificationsProvider>
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
