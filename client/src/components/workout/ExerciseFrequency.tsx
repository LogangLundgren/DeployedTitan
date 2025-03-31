import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutWithDetails, Exercise } from "@shared/schema";
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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ExerciseFrequencyData {
  name: string;
  value: number;
  category: string;
  color?: string;
}

interface CategoryData {
  name: string;
  value: number;
  color?: string;
}

interface ExerciseFrequencyProps {
  userId: number;
}

export default function ExerciseFrequency({ userId }: ExerciseFrequencyProps) {
  const [timeRange, setTimeRange] = useState<string>("30");
  const [view, setView] = useState<"exercises" | "categories">("exercises");
  const [exerciseData, setExerciseData] = useState<ExerciseFrequencyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  // Fetch recent workouts
  const { data: workouts, isLoading: workoutsLoading } = useQuery<WorkoutWithDetails[]>({
    queryKey: ['/api/workouts/recent', userId, parseInt(timeRange)],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/workouts/recent?userId=${userId}&limit=${timeRange}`);
        if (!res.ok) throw new Error('Failed to fetch workouts');
        return res.json();
      } catch (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }
    }
  });

  // Fetch all exercises for categories
  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/exercises');
        if (!res.ok) throw new Error('Failed to fetch exercises');
        return res.json();
      } catch (error) {
        console.error('Error fetching exercises:', error);
        return [];
      }
    }
  });

  // Process workout data for exercise frequency
  useEffect(() => {
    if (!workouts || !exercises) return;
    
    // Map to count exercise appearances
    const exerciseFrequency = new Map<number, number>();
    const categoryFrequency = new Map<string, number>();
    
    // Count exercises and categories across all workouts
    workouts.forEach(workout => {
      workout.exercises.forEach(exerciseEntry => {
        const exerciseId = exerciseEntry.exerciseDetails.id;
        const currentCount = exerciseFrequency.get(exerciseId) || 0;
        exerciseFrequency.set(exerciseId, currentCount + 1);
        
        const category = exerciseEntry.exerciseDetails.category;
        const currentCategoryCount = categoryFrequency.get(category) || 0;
        categoryFrequency.set(category, currentCategoryCount + 1);
      });
    });
    
    // Prepare exercise data
    const exerciseDataArray: ExerciseFrequencyData[] = [];
    
    // Define a set of colors for the pie chart
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', 
      '#84cc16', '#10b981', '#06b6d4', '#6366f1', '#a855f7',
      '#7c3aed', '#4f46e5', '#2563eb', '#0ea5e9', '#06b6d4',
      '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#a3e635'
    ];
    
    // Convert exercise frequency to array
    exerciseFrequency.forEach((count, exerciseId) => {
      const exerciseDetails = exercises.find(ex => ex.id === exerciseId);
      if (exerciseDetails) {
        exerciseDataArray.push({
          name: exerciseDetails.name,
          value: count,
          category: exerciseDetails.category
        });
      }
    });
    
    // Convert category frequency to array
    const categoryDataArray: CategoryData[] = [];
    categoryFrequency.forEach((count, category) => {
      categoryDataArray.push({
        name: category,
        value: count
      });
    });
    
    // Sort by frequency (descending)
    exerciseDataArray.sort((a, b) => b.value - a.value);
    categoryDataArray.sort((a, b) => b.value - a.value);
    
    // Assign colors
    exerciseDataArray.forEach((item, index) => {
      item.color = colors[index % colors.length];
    });
    
    categoryDataArray.forEach((item, index) => {
      item.color = colors[index % colors.length];
    });
    
    // Limit to top 10 exercises for better visualization
    setExerciseData(exerciseDataArray.slice(0, 10));
    setCategoryData(categoryDataArray);
  }, [workouts, exercises]);

  // Generate percentage label for tooltip
  const generatePercentage = (value: number, dataArray: ExerciseFrequencyData[] | CategoryData[]) => {
    const total = dataArray.reduce((sum, item) => sum + item.value, 0);
    return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';
  };

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string, props: any) => {
    const data = view === 'exercises' ? exerciseData : categoryData;
    return [
      `${value} times (${generatePercentage(value, data)})`, 
      name
    ];
  };

  // Active shape renderer for hover effect
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    
    return (
      <g>
        <text x={cx} y={cy} dy={0} textAnchor="middle" fill="#333" fontSize="14px" fontWeight="bold">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#666" fontSize="12px">
          {payload.value} times
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 5}
          outerRadius={outerRadius + 10}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const isLoading = workoutsLoading || exercisesLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Exercise Frequency Analysis</CardTitle>
        <CardDescription>
          See which exercises and muscle groups you train most frequently
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium mb-1.5 text-gray-500 block">
              Time Period
            </label>
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="180">Last 6 Months</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs 
            value={view} 
            onValueChange={(v) => setView(v as "exercises" | "categories")}
            className="w-full md:w-2/3"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="exercises">Top Exercises</TabsTrigger>
              <TabsTrigger value="categories">Muscle Groups</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : (view === 'exercises' && exerciseData.length === 0) || 
           (view === 'categories' && categoryData.length === 0) ? (
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
              <path d="M18 11.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.4" />
              <path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
              <path d="M6 14v0a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="m7 9 4.5 7L16 9" />
            </svg>
            <p className="text-gray-400">No workout data available for this time period</p>
          </div>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={view === 'exercises' ? exerciseData : categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {(view === 'exercises' ? exerciseData : categoryData).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3 text-gray-700">
                {view === 'exercises' ? 'Top Exercises' : 'Muscle Groups'} Breakdown:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(view === 'exercises' ? exerciseData : categoryData).map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-2 rounded-md border"
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 text-sm truncate">{item.name}</div>
                    <div className="text-sm font-medium">
                      {item.value} ({generatePercentage(item.value, view === 'exercises' ? exerciseData : categoryData)})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}