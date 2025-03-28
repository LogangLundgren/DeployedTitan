interface WorkoutSummaryProps {
  duration: number;
  setDuration: (duration: number) => void;
  volume: number;
  totalSets: number;
  totalExercises: number;
}

export default function WorkoutSummary({ 
  duration, 
  setDuration, 
  volume, 
  totalSets, 
  totalExercises 
}: WorkoutSummaryProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium mb-3">Workout Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-400">Duration</p>
          <div className="flex items-center">
            <input
              type="number"
              className="w-16 px-2 py-1 mr-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
            />
            <span className="font-medium">minutes</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-400">Volume</p>
          <p className="font-medium">{volume.toLocaleString()} lbs</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Sets</p>
          <p className="font-medium">{totalSets}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Exercises</p>
          <p className="font-medium">{totalExercises}</p>
        </div>
      </div>
    </div>
  );
}
