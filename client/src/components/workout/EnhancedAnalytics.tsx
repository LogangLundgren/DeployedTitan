import { useState } from "react";
import WorkoutAnalytics from "./WorkoutAnalytics";
import PersonalRecords from "./PersonalRecords";
import MonthlyComparison from "./MonthlyComparison";
import WorkoutHeatmap from "./WorkoutHeatmap";
import ExerciseFrequency from "./ExerciseFrequency";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface EnhancedAnalyticsProps {
  userId?: number; // Made optional since we'll use the authenticated user
}

export default function EnhancedAnalytics({ userId }: EnhancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("progress");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="records">Personal Records</TabsTrigger>
          <TabsTrigger value="comparison">Monthly Comparison</TabsTrigger>
          <TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
          <TabsTrigger value="frequency">Exercise Frequency</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="mt-6">
          <WorkoutAnalytics />
        </TabsContent>
        
        <TabsContent value="records" className="mt-6">
          <PersonalRecords />
        </TabsContent>
        
        <TabsContent value="comparison" className="mt-6">
          <MonthlyComparison />
        </TabsContent>
        
        <TabsContent value="heatmap" className="mt-6">
          <WorkoutHeatmap />
        </TabsContent>
        
        <TabsContent value="frequency" className="mt-6">
          <ExerciseFrequency />
        </TabsContent>
      </Tabs>
    </div>
  );
}