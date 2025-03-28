import { format } from "date-fns";
import { WorkoutWithDetails } from "@shared/schema";
import { Link } from "wouter";

interface RecentWorkoutsProps {
  workouts: WorkoutWithDetails[];
  isLoading: boolean;
}

export default function RecentWorkouts({ workouts, isLoading }: RecentWorkoutsProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">Recent Workouts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-1/3">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-10"></div>
                </div>
                <div className="w-1/3">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-1/3">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">Recent Workouts</h3>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400 mb-4">You haven't logged any workouts yet.</p>
          <Link href="/workouts">
            <a className="inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Log Your First Workout
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4">Recent Workouts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((workout) => (
          <Link key={workout.id} href={`/workouts/${workout.id}`}>
            <a className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{workout.name}</h4>
                  <p className="text-sm text-gray-400">
                    {format(new Date(workout.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${workout.category === 'Strength' ? 'bg-orange-500/10 text-orange-500' : 
                    workout.category === 'Hypertrophy' ? 'bg-green-500/10 text-green-500' : 
                    workout.category === 'HIIT' ? 'bg-yellow-500/10 text-yellow-500' : 
                    'bg-primary/10 text-primary'}
                `}>
                  {workout.category}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-400">Duration</p>
                  <p className="font-medium">{workout.duration} min</p>
                </div>
                <div>
                  <p className="text-gray-400">Volume</p>
                  <p className="font-medium">
                    {workout.volume > 0 
                      ? `${workout.volume.toLocaleString()} lbs` 
                      : 'Body weight'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Exercises</p>
                  <p className="font-medium">{workout.totalExercises}</p>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
