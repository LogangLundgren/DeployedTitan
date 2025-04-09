import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500">Welcome to your fitness dashboard</p>
      </div>
      
      {/* Goals Section - moved from Goals.tsx */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Goals</h2>
          <Link href="/goals">
            <span className="text-primary hover:underline font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              Manage Goals
            </span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* This is a simplified version of the Goals component */}
          {/* We'll just show a few sample goals for now */}
          <Card>
            <CardHeader className="pb-4">
              <Badge variant="default">Strength</Badge>
              <CardTitle className="mt-2">Bench Press 200 lbs</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>175 / 200 lbs</span>
                </div>
                <Progress value={87.5} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started: Apr 1, 2025</span>
                <span>Target: Jun 15, 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <Badge variant="secondary">Endurance</Badge>
              <CardTitle className="mt-2">Run 10K under 50 min</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>55 / 50 min</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started: Mar 15, 2025</span>
                <span>Target: May 20, 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <Badge variant="outline">Flexibility</Badge>
              <CardTitle className="mt-2">Touch toes for 30 sec</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>20 / 30 sec</span>
                </div>
                <Progress value={66.6} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started: Apr 5, 2025</span>
                <span>Target: May 5, 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Link href="/goals">
            <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center h-full">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8" />
                    <path d="M8 12h8" />
                  </svg>
                </div>
                <p className="text-primary font-medium">Add New Goal</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Add any additional sections here if needed in the future */}
    </main>
  );
}
