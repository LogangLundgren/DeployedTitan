import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, parseISO, eachDayOfInterval, subDays, startOfWeek, endOfWeek, getDay } from "date-fns";

type HeatmapMetric = 'volume' | 'intensity' | 'workouts';

interface DailyActivity {
  date: string;
  value: number;
  workouts: number;
  intensity: number;
  volume: number;
  tooltip: string;
}

interface WorkoutHeatmapProps {
  userId?: number; // Made optional since we'll use the authenticated user
}

export default function WorkoutHeatmap({ userId }: WorkoutHeatmapProps) {
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>('workouts');
  const [heatmapData, setHeatmapData] = useState<DailyActivity[]>([]);
  const [weeks, setWeeks] = useState<DailyActivity[][]>([]);

  // Fetch ALL workouts for all-time data
  const { data: workouts, isLoading } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/workouts`);
        if (!res.ok) throw new Error('Failed to fetch workouts');
        const data = await res.json();
        console.log("Fetched all workouts for heatmap:", data.length);
        return data;
      } catch (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }
    }
  });

  // Process workouts into heatmap data
  useEffect(() => {
    if (!workouts) return;

    // Create array of all days for the last year
    const today = new Date();
    const startDate = subDays(today, 365);
    
    const allDays = eachDayOfInterval({
      start: startDate,
      end: today
    });

    // Initialize daily activity map with zero values
    const dailyActivityMap = new Map<string, DailyActivity>();
    
    allDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      dailyActivityMap.set(dateStr, {
        date: dateStr,
        value: 0, // This will be set based on the selected metric
        workouts: 0,
        intensity: 0,
        volume: 0,
        tooltip: ``
      });
    });
    
    // Process each workout
    workouts.forEach(workout => {
      // Safely parse date from any format
      let workoutDate: Date;
      try {
        if (workout.date instanceof Date) {
          workoutDate = workout.date;
        } else if (typeof workout.date === 'string') {
          workoutDate = new Date(workout.date);
        } else {
          workoutDate = new Date(String(workout.date));
        }
        
        // Verify we have a valid date
        if (isNaN(workoutDate.getTime())) {
          console.warn("Invalid date for workout ID:", workout.id, workout.date);
          return; // Skip workouts with invalid dates
        }
      } catch (e) {
        console.error("Error parsing workout date:", workout.date, e);
        return; // Skip workouts with unparseable dates
      }
      
      // Format as ISO date string for map lookup
      const dateKey = format(workoutDate, 'yyyy-MM-dd');
      
      // Skip if workout date is not in our range
      if (!dailyActivityMap.has(dateKey)) {
        console.log(`Workout date ${dateKey} outside of date range`);
        return;
      }
      
      const dayData = dailyActivityMap.get(dateKey)!;
      
      // Increment workout count
      dayData.workouts += 1;
      
      // Calculate volume (weight × reps)
      let totalVolume = 0;
      let totalSets = 0;
      
      workout.exercises.forEach(exercise => {
        if (!exercise.sets) {
          console.warn(`Workout ID ${workout.id} missing sets array for exercise`);
          return;
        }
        
        exercise.sets.forEach(set => {
          if (set.weight && set.reps) {
            totalVolume += set.weight * set.reps;
            totalSets++;
          }
        });
      });
      
      // Calculate intensity (average weight per set)
      const intensity = totalSets > 0 ? totalVolume / totalSets : 0;
      
      // Update metrics
      dayData.volume += totalVolume;
      dayData.intensity = Math.max(dayData.intensity, intensity);
      
      console.log(`Added workout ID ${workout.id} for date ${dateKey}: Volume=${totalVolume}, Sets=${totalSets}`);
      
      // Create tooltip text
      dayData.tooltip = `${format(new Date(workoutDate), 'MMM d, yyyy')}\n`;
      dayData.tooltip += `Workouts: ${dayData.workouts}\n`;
      dayData.tooltip += `Volume: ${dayData.volume.toLocaleString()} lbs\n`;
      dayData.tooltip += `Intensity: ${Math.round(dayData.intensity)} lbs/set`;
      
      // Update in map - use the string key (dateKey), not the Date object
      dailyActivityMap.set(dateKey, dayData);
    });
    
    // Update value based on selected metric
    const processedData = Array.from(dailyActivityMap.values()).map(day => {
      return {
        ...day,
        value: selectedMetric === 'workouts' 
          ? day.workouts 
          : selectedMetric === 'volume' 
            ? day.volume 
            : day.intensity
      };
    });
    
    setHeatmapData(processedData);
  }, [workouts, selectedMetric]);

  // Organize data into weeks for rendering
  useEffect(() => {
    if (heatmapData.length === 0) return;
    
    // Sort data by date
    const sortedData = [...heatmapData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Group by weeks (7 days per row, starting from Sunday)
    const weekData: DailyActivity[][] = [];
    let currentWeek: DailyActivity[] = [];
    
    sortedData.forEach((day, index) => {
      const dayOfWeek = getDay(new Date(day.date)); // 0 = Sunday, 6 = Saturday
      
      // If it's the first day (Sunday) or the first item, start a new week
      if (dayOfWeek === 0 || index === 0) {
        // If we already have days in the current week, push it to weeks array
        if (currentWeek.length > 0) {
          weekData.push(currentWeek);
        }
        currentWeek = [];
        
        // If it's not Sunday, add empty cells for padding
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({
            date: '',
            value: -1, // Use -1 to identify empty cells
            workouts: 0,
            intensity: 0,
            volume: 0,
            tooltip: ''
          });
        }
      }
      
      currentWeek.push(day);
      
      // If it's the last day of data or the last day of the week (Saturday)
      if (index === sortedData.length - 1 || dayOfWeek === 6) {
        // If it's not Saturday, add empty cells for padding
        if (dayOfWeek !== 6) {
          for (let i = dayOfWeek + 1; i <= 6; i++) {
            currentWeek.push({
              date: '',
              value: -1,
              workouts: 0,
              intensity: 0,
              volume: 0,
              tooltip: ''
            });
          }
        }
        
        weekData.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Limit to the last 4 months (approximately 16-17 weeks)
    const recentWeeks = weekData.slice(-17);
    setWeeks(recentWeeks);
  }, [heatmapData]);

  // Calculate the color for a cell based on its value
  const getCellColor = (value: number) => {
    if (value < 0) return 'bg-transparent'; // Empty cell
    if (value === 0) return 'bg-gray-100';
    
    let intensity = 0;
    
    // Scale the intensity based on the metric
    if (selectedMetric === 'workouts') {
      // For workouts, scale from 1-3+
      intensity = Math.min(value / 3, 1);
    } else if (selectedMetric === 'volume') {
      // For volume, scale from 0-10,000+
      intensity = Math.min(value / 10000, 1);
    } else {
      // For intensity, scale from 0-300+
      intensity = Math.min(value / 300, 1);
    }
    
    // Convert intensity to a color scale from light to dark
    // Using primary blue at different opacities
    const colorClass = 
      intensity <= 0.2 ? 'bg-primary/10' :
      intensity <= 0.4 ? 'bg-primary/30' :
      intensity <= 0.6 ? 'bg-primary/50' :
      intensity <= 0.8 ? 'bg-primary/70' :
      'bg-primary/90';
    
    return colorClass;
  };

  // Format value for display
  const formatValue = (value: number, metric: HeatmapMetric) => {
    if (value <= 0) return '–';
    
    if (metric === 'workouts') {
      return value.toString();
    } else if (metric === 'volume') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
    } else {
      return value.toFixed(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Workout Activity Heatmap</CardTitle>
        <CardDescription>
          View your recent workout patterns based on all your tracked data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500 mb-1.5 block">
            Display Metric
          </label>
          <Select
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric(value as HeatmapMetric)}
          >
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workouts">Workout Count</SelectItem>
              <SelectItem value="volume">Total Volume</SelectItem>
              <SelectItem value="intensity">Average Intensity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="h-60 flex items-center justify-center">
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : weeks.length === 0 ? (
          <div className="h-60 flex items-center justify-center flex-col">
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
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <p className="text-gray-400">No workout data available</p>
          </div>
        ) : (
          <>
            {/* Day labels */}
            <div className="flex text-xs text-gray-500 mb-1">
              <div className="w-10" /> {/* Spacer for week numbers */}
              <div className="flex-1 grid grid-cols-7 text-center">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
            </div>
            
            {/* Heatmap grid */}
            <div className="mb-4">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex h-10">
                  {/* Week label */}
                  <div className="w-10 flex items-center justify-center text-xs text-gray-500">
                    {week.some(day => day.date) && 
                      format(new Date(week.find(day => day.date)?.date || new Date()), 'MMM')
                    }
                  </div>
                  
                  {/* Days in week */}
                  <div className="flex-1 grid grid-cols-7 gap-1">
                    {week.map((day, dayIndex) => (
                      <TooltipProvider key={dayIndex}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`h-10 rounded ${getCellColor(day.value)} flex items-center justify-center 
                                ${day.value > 0 ? 'cursor-pointer transition-colors duration-200 hover:opacity-80' : ''}`}
                            >
                              {day.value >= 0 && (
                                <span className="text-xs font-medium">
                                  {formatValue(day.value, selectedMetric)}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          {day.value > 0 && (
                            <TooltipContent>
                              <div className="text-sm whitespace-pre-line">
                                {day.tooltip}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-5 h-5 bg-gray-100 rounded"></div>
                <div className="w-5 h-5 bg-primary/10 rounded"></div>
                <div className="w-5 h-5 bg-primary/30 rounded"></div>
                <div className="w-5 h-5 bg-primary/50 rounded"></div>
                <div className="w-5 h-5 bg-primary/70 rounded"></div>
                <div className="w-5 h-5 bg-primary/90 rounded"></div>
              </div>
              <span>More</span>
              <span className="ml-2">
                {selectedMetric === 'workouts' ? '(workouts per day)' : 
                 selectedMetric === 'volume' ? '(total pounds lifted)' : 
                 '(average weight per set)'}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}