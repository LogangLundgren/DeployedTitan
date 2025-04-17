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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";

interface MonthlyData {
  name: string; // Month name
  currentYear: number;
  previousYear: number;
  change: number;
}

type MetricType = 'workouts' | 'volume' | 'sets';

interface MonthlyComparisonProps {
  userId?: number; // Made optional since we'll use the authenticated user
}

export default function MonthlyComparison({ userId }: MonthlyComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('workouts');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  
  // Fetch all workouts for the user - we need a good amount of data for comparison
  const { data: workouts, isLoading } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts/recent', 365], // Get a year's worth of workouts
    queryFn: async () => {
      try {
        const res = await fetch(`/api/workouts/recent?limit=365`);
        if (!res.ok) throw new Error('Failed to fetch workouts');
        return res.json();
      } catch (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }
    }
  });

  useEffect(() => {
    if (!workouts || workouts.length === 0) return;

    // Get current date information
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const previousYear = currentYear - 1;

    // Initialize monthly data array with all months
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const initialMonthlyData = months.map(month => ({
      name: month,
      currentYear: 0,
      previousYear: 0,
      change: 0
    }));

    // Process all workouts and group by month and year
    const currentYearData = new Array(12).fill(0);
    const previousYearData = new Array(12).fill(0);
    
    console.log(`Processing ${workouts.length} workouts for monthly comparison`);
    
    workouts.forEach(workout => {
      // Handle different date formats safely
      let workoutDate: Date;
      
      if (typeof workout.date === 'string') {
        workoutDate = new Date(workout.date);
      } else if (workout.date instanceof Date) {
        workoutDate = workout.date;
      } else {
        // For any other case, try to convert safely
        try {
          workoutDate = new Date(String(workout.date));
        } catch (e) {
          console.error("Unable to parse date:", workout.date);
          return; // Skip this workout if date can't be parsed
        }
      }
      
      // Verify we have a valid date
      if (!workoutDate || isNaN(workoutDate.getTime())) {
        console.error("Invalid date after parsing:", workout.date);
        return; // Skip workouts with invalid dates
      }
      
      const workoutYear = workoutDate.getFullYear();
      const workoutMonth = workoutDate.getMonth();
      
      console.log(`Workout ID ${workout.id} date: ${workoutYear}-${workoutMonth+1}, comparing to ${currentYear} and ${previousYear}`);
      
      // Skip workouts older than previous year
      if (workoutYear < previousYear) return;
      
      let metricValue = 0;
      
      if (selectedMetric === 'workouts') {
        metricValue = 1; // Count as one workout
      } else if (selectedMetric === 'sets') {
        // Count total sets across all exercises
        metricValue = workout.exercises.reduce((total, exercise) => {
          if (!exercise.sets) {
            console.warn(`Exercise in workout ${workout.id} missing sets array`);
            return total;
          }
          return total + exercise.sets.length;
        }, 0);
      } else if (selectedMetric === 'volume') {
        // Calculate total volume (weight × reps)
        metricValue = workout.exercises.reduce((total, exercise) => {
          return total + exercise.sets.reduce((setTotal, set) => {
            return setTotal + (set.weight && set.reps ? set.weight * set.reps : 0);
          }, 0);
        }, 0);
      }
      
      if (workoutYear === currentYear) {
        currentYearData[workoutMonth] += metricValue;
      } else if (workoutYear === previousYear) {
        previousYearData[workoutMonth] += metricValue;
      }
    });
    
    // Calculate change percentages and update data
    const updatedMonthlyData = initialMonthlyData.map((item, index) => {
      const current = currentYearData[index];
      const previous = previousYearData[index];
      
      // Calculate percentage change
      let change = 0;
      if (previous > 0) {
        change = ((current - previous) / previous) * 100;
      } else if (current > 0) {
        change = 100; // If previous was 0 and current is positive, that's a 100% increase
      }
      
      return {
        name: item.name,
        currentYear: current,
        previousYear: previous,
        change: Math.round(change)
      };
    });
    
    setMonthlyData(updatedMonthlyData);
  }, [workouts, selectedMetric]);

  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    if (selectedMetric === 'volume' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}k lbs`;
    }
    return selectedMetric === 'volume' ? `${value} lbs` : value.toString();
  };

  // Get y-axis label based on selected metric
  const getYAxisLabel = () => {
    switch (selectedMetric) {
      case 'workouts':
        return 'Number of Workouts';
      case 'sets':
        return 'Total Sets';
      case 'volume':
        return 'Total Volume (lbs)';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Monthly Progress Comparison</CardTitle>
        <CardDescription>
          Compare your progress this year versus last year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-500 mb-1.5 block">Metric</label>
          <Select
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric(value as MetricType)}
          >
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workouts">Workouts Count</SelectItem>
              <SelectItem value="sets">Total Sets</SelectItem>
              <SelectItem value="volume">Total Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="h-80 flex items-center justify-center flex-col">
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
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <p className="text-gray-400">No comparison data available yet</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis>
                  <Label
                    value={getYAxisLabel()}
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: 'middle', fontSize: '12px' }}
                  />
                </YAxis>
                <Tooltip 
                  formatter={(value: number) => [
                    formatTooltipValue(value),
                    selectedMetric === 'workouts' ? 'Workouts' :
                    selectedMetric === 'sets' ? 'Sets' : 'Volume'
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar 
                  name={`This Year (${new Date().getFullYear()})`} 
                  dataKey="currentYear" 
                  fill="hsl(240, 50%, 30%)" 
                />
                <Bar 
                  name={`Last Year (${new Date().getFullYear() - 1})`} 
                  dataKey="previousYear" 
                  fill="hsl(240, 30%, 70%)" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Year-over-year change indicators */}
        {!isLoading && monthlyData.some(data => data.currentYear > 0 || data.previousYear > 0) && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
            {monthlyData.map((month) => (
              <div 
                key={month.name} 
                className={`rounded-md p-2 text-center ${
                  month.currentYear === 0 && month.previousYear === 0
                    ? 'bg-gray-100'
                    : month.change > 0
                    ? 'bg-green-100 text-green-800'
                    : month.change < 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <div className="text-xs font-semibold">{month.name}</div>
                <div className="text-sm font-bold">
                  {month.currentYear === 0 && month.previousYear === 0
                    ? '—'
                    : month.change > 0
                    ? `+${month.change}%`
                    : `${month.change}%`}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}