import { useState } from "react";
import { WorkoutWithDetails } from "@shared/schema";
import WorkoutForm from "@/components/workout/WorkoutForm";
import WorkoutHistory from "@/components/workout/WorkoutHistory";
import TemplateSelector from "@/components/workout/TemplateSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type TabType = 'log' | 'history' | 'templates';

export default function WorkoutLogger() {
  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutWithDetails | null>(null);
  
  // In a real app, this would use the authenticated user's ID
  const userId = 1;
  
  // Handle when a new workout is created from template
  const handleWorkoutCreated = (workout: WorkoutWithDetails) => {
    setCurrentWorkout(workout);
    setActiveTab('log');
  };
  
  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Workout Logger</h2>
        <p className="text-gray-500">Track your workouts and monitor your progress</p>
      </div>
      
      {currentWorkout && (
        <Alert className="mb-6 border-green-100 bg-green-50">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Workout Started!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your workout "{currentWorkout.name}" has been created from template with {currentWorkout.exercises.length} exercises.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6 border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-0 pt-6 px-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Log Your Workout</CardTitle>
              <CardDescription>
                Record your sets, weights, and reps for each exercise
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {activeTab === 'log' && currentWorkout && (
                <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                  Workout Active
                </div>
              )}
              {activeTab === 'log' && !currentWorkout && (
                <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  Ready to start
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="w-full"
        >
          <div className="px-6 border-b">
            <TabsList className="justify-start h-12 p-0 bg-transparent border-b-0 w-full">
              <TabsTrigger 
                value="log"
                className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Log Workout
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v4l2 2"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  History
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="templates"
                className="h-12 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                  Templates
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="p-0">
            <TabsContent value="log" className="p-0 m-0">
              <div className="p-6">
                {currentWorkout ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{currentWorkout.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          <span>{currentWorkout.exercises.length} exercises</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span>{currentWorkout.totalSets} sets</span>
                        </div>
                      </div>
                    </div>
                    <WorkoutForm workout={currentWorkout} />
                  </div>
                ) : (
                  <div className="mb-4">
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No active workout</AlertTitle>
                      <AlertDescription>
                        Start a new workout manually or quickly begin one from your saved templates.
                      </AlertDescription>
                    </Alert>
                    <WorkoutForm />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="p-0 m-0">
              <WorkoutHistory 
                userId={userId} 
                onViewWorkout={(workout) => {
                  setCurrentWorkout(workout);
                  setActiveTab('log');
                }}
              />
            </TabsContent>
            
            <TabsContent value="templates" className="p-0 m-0">
              <TemplateSelector 
                userId={userId} 
                onWorkoutCreated={handleWorkoutCreated} 
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </main>
  );
}
