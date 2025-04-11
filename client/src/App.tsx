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
import PurchasedPlanDetail from "@/pages/PurchasedPlanDetail";
import CoachProfile from "@/pages/CoachProfile";
import UserProfile from "@/pages/UserProfile";
import AdminDashboard from "@/pages/AdminDashboard";
import MyPlans from "@/pages/MyPlans";
import BecomeCoach from "@/pages/BecomeCoach";
import CreatePlan from "@/pages/CreatePlan";
import Checkout from "@/pages/Checkout";
import PlanCheckout from "@/pages/PlanCheckout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import AuthPage from "@/pages/auth-page";
import Onboarding from "@/pages/Onboarding";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import { NotificationsProvider } from "./context/NotificationsContext";
import { FollowProvider } from "./context/follow-context";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const { user } = useAuth();
  
  // Use real user id from authenticated user for notifications
  // If not authenticated, fallback is handled by protected routes
  const userId = user?.id || 1;
  
  // Determine whether to show the main layout based on current route
  // Don't show header/nav/footer on auth or onboarding pages
  const path = window.location.pathname;
  const isAuthPage = path === '/auth';
  const isOnboardingPage = path === '/onboarding';
  const hideLayout = isAuthPage || isOnboardingPage;
  
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationsProvider userId={userId}>
        {!hideLayout && <Header />}
        {!hideLayout && <Navigation />}
        <div className={!hideLayout ? 'flex-1' : 'min-h-screen'}>
          <Switch>
            {/* Public routes */}
            <Route path="/auth" component={AuthPage} />
            <Route path="/marketplace" component={Marketplace} />
            
            {/* Protected routes */}
            <ProtectedRoute path="/onboarding" component={Onboarding} />
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/workouts" component={WorkoutLogger} />
            <ProtectedRoute path="/templates/:id" component={TemplateDetail} />
            <ProtectedRoute path="/profile" component={Profile} />
            <ProtectedRoute path="/goals" component={Goals} />
            <ProtectedRoute path="/social" component={Social} />
            <ProtectedRoute path="/workout-plans/:id" component={WorkoutPlanDetail} />
            <ProtectedRoute path="/purchased-plans/:id" component={PurchasedPlanDetail} />
            <ProtectedRoute path="/coaches/:id" component={CoachProfile} />
            <ProtectedRoute path="/users/:userId" component={UserProfile} />
            <ProtectedRoute path="/my-plans" component={MyPlans} />
            <ProtectedRoute path="/become-coach" component={BecomeCoach} />
            <ProtectedRoute path="/create-plan" component={CreatePlan} />
            <ProtectedRoute path="/plan-checkout" component={PlanCheckout} />
            <ProtectedRoute path="/checkout" component={Checkout} />
            <ProtectedRoute path="/payment-success" component={PaymentSuccess} />
            <ProtectedRoute path="/admin" component={AdminDashboard} />
            
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </div>
        {!hideLayout && <Footer />}
      </NotificationsProvider>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FollowProvider>
          <Router />
          <Toaster />
        </FollowProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
