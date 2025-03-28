import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails } from "@shared/schema";
import WorkoutForm from "@/components/workout/WorkoutForm";
import RecentWorkouts from "@/components/workout/RecentWorkouts";

type TabType = 'log' | 'history' | 'templates';

export default function WorkoutLogger() {
  const [activeTab, setActiveTab] = useState<TabType>('log');
  
  // In a real app, this would use the authenticated user's ID
  const userId = 1;
  
  const { data: recentWorkouts, isLoading } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts/recent', userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/workouts/recent?userId=${userId}&limit=3`);
        if (!res.ok) throw new Error('Failed to fetch recent workouts');
        return res.json();
      } catch (error) {
        console.error('Error fetching recent workouts:', error);
        return [];
      }
    }
  });
  
  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-500">Workout Logger</h2>
        <p className="text-gray-400">Track your workouts and monitor your progress</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b">
          <button 
            className={`px-6 py-3 ${activeTab === 'log' ? 'text-primary border-b-2 border-primary font-medium' : 'text-gray-400 hover:text-primary'}`}
            onClick={() => setActiveTab('log')}
          >
            Log Workout
          </button>
          <button 
            className={`px-6 py-3 ${activeTab === 'history' ? 'text-primary border-b-2 border-primary font-medium' : 'text-gray-400 hover:text-primary'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button 
            className={`px-6 py-3 ${activeTab === 'templates' ? 'text-primary border-b-2 border-primary font-medium' : 'text-gray-400 hover:text-primary'}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'log' && <WorkoutForm />}
          
          {activeTab === 'history' && (
            <div className="text-center py-8">
              <p className="text-gray-400">History will be implemented in a future update</p>
            </div>
          )}
          
          {activeTab === 'templates' && (
            <div className="text-center py-8">
              <p className="text-gray-400">Templates will be implemented in a future update</p>
            </div>
          )}
        </div>
      </div>
      
      <RecentWorkouts workouts={recentWorkouts || []} isLoading={isLoading} />
    </main>
  );
}
