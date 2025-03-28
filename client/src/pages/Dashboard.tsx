import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails } from "@shared/schema";
import RecentWorkouts from "@/components/workout/RecentWorkouts";

export default function Dashboard() {
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
        <h2 className="text-2xl font-bold text-gray-500">Dashboard</h2>
        <p className="text-gray-400">Welcome to your fitness dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/workouts">
              <a className="flex items-center justify-between w-full p-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-md transition-colors">
                <span className="font-medium">Log Workout</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                </svg>
              </a>
            </Link>
            <Link href="/progress">
              <a className="flex items-center justify-between w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                <span className="font-medium">Track Progress</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </a>
            </Link>
            <Link href="/nutrition">
              <a className="flex items-center justify-between w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                <span className="font-medium">Log Nutrition</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z" />
                  <path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8" />
                  <path d="M15 2v5h5" />
                </svg>
              </a>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Weekly Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Workouts</p>
              <p className="text-2xl font-medium">4</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Volume</p>
              <p className="text-2xl font-medium">32,400 lbs</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-2xl font-medium">173 min</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Calories</p>
              <p className="text-2xl font-medium">2,450</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Your Program</h3>
          <div className="text-center">
            <div className="h-36 flex items-center justify-center flex-col">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-300 mb-2"
              >
                <path d="M18 11.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.4" />
                <path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
                <path d="M6 14v0a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="m7 9 4.5 7L16 9" />
              </svg>
              <p className="text-gray-400 mb-2">No active program</p>
              <Link href="/programs">
                <a className="text-primary text-sm">Browse Programs</a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <RecentWorkouts workouts={recentWorkouts || []} isLoading={isLoading} />
    </main>
  );
}
