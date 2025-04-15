import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [tab, setTab] = useState<string>("login");
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Check URL for tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'register') {
      setTab('register');
    }
  }, []);

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Initialize forms with react-hook-form
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (values: LoginForm) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterForm) => {
    registerMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8">
        <div className="w-full max-w-md">
          <Tabs value={tab} onValueChange={setTab} defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Login to Titan Fitness</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <span className="flex items-center">
                            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                            Logging in...
                          </span>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Create an Account</CardTitle>
                  <CardDescription>
                    Join Titan Fitness to track your workouts and connect with other fitness enthusiasts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <span className="flex items-center">
                            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                            Creating account...
                          </span>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Hero */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 p-12 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Welcome to Titan Fitness
          </h1>
          <p className="text-xl mb-4">
            Your complete fitness companion for tracking workouts, setting goals, and transforming your body.
          </p>
          <ul className="space-y-2 mb-8">
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">✓</div>
              Track your workouts and progress
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">✓</div>
              Create and follow workout plans
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">✓</div>
              Connect with coaches and fitness enthusiasts
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">✓</div>
              Set and achieve your fitness goals
            </li>
          </ul>
          <p className="text-lg italic">"Transform your body, transform your life."</p>
        </div>
      </div>
    </div>
  );
}