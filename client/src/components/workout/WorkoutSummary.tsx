interface WorkoutSummaryProps {
  volume: number;
  totalSets: number;
  totalExercises: number;
}

export default function WorkoutSummary({ 
  volume, 
  totalSets, 
  totalExercises 
}: WorkoutSummaryProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium mb-3">Workout Summary</h3>
      <div className="grid grid-cols-3 gap-4">
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
