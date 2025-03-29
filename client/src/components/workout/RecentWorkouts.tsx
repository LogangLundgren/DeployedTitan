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
      <div>
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
      <div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
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
            className="mx-auto mb-4 text-gray-300"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p className="text-gray-500 mb-4">You haven't logged any workouts yet.</p>
          <Link href="/workouts">
            <button className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Log Your First Workout
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((workout) => {
          // Safely format the date by handling both string and Date formats
          let dateDisplay;
          try {
            dateDisplay = format(new Date(workout.date), "MMMM d, yyyy");
          } catch (error) {
            dateDisplay = String(workout.date);
          }
          
          return (
            <div key={workout.id} className="cursor-pointer" onClick={() => window.location.href = `/workouts/${workout.id}`}>
              <div className="group bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">{workout.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <p className="text-sm text-gray-500">
                        {dateDisplay}
                      </p>
                    </div>
                  </div>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${workout.category === 'Strength' ? 'bg-orange-500/10 text-orange-600' : 
                      workout.category === 'Hypertrophy' ? 'bg-green-500/10 text-green-600' : 
                      workout.category === 'HIIT' ? 'bg-yellow-500/10 text-yellow-600' : 
                      'bg-primary/10 text-primary'}
                  `}>
                    {workout.category || 'Workout'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2 bg-gray-50 p-3 rounded-md">
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="font-medium text-sm">{workout.duration || '—'} min</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                        <line x1="6" y1="1" x2="6" y2="4"></line>
                        <line x1="10" y1="1" x2="10" y2="4"></line>
                        <line x1="14" y1="1" x2="14" y2="4"></line>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Volume</p>
                    <p className="font-medium text-sm">
                      {workout.volume > 0 
                        ? workout.volume > 1000 
                          ? `${(workout.volume / 1000).toFixed(1)}k lbs` 
                          : `${workout.volume} lbs` 
                        : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Exercises</p>
                    <p className="font-medium text-sm">{workout.totalExercises || '—'}</p>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-right">
                  <span className="text-primary group-hover:underline">View details →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
