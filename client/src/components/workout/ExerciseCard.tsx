import { ExerciseWithSets } from "./WorkoutForm";

interface ExerciseCardProps {
  exercise: ExerciseWithSets;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, field: 'weight' | 'reps' | 'notes', value: number | string | null) => void;
}

export default function ExerciseCard({ exercise, onRemove, onAddSet, onRemoveSet, onUpdateSet }: ExerciseCardProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{exercise.exerciseDetails.name}</h4>
          <p className="text-sm text-gray-400">
            {exercise.exerciseDetails.category} • {exercise.exerciseDetails.subcategory}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-1 text-gray-400 hover:text-primary">
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
              <path d="M15.5 3h5l-10 18L1.5 3h5" />
              <path d="m11.5 3 7 8" />
              <path d="m8.5 3-2 8" />
            </svg>
          </button>
          <button className="p-1 text-gray-400 hover:text-red-500" onClick={onRemove}>
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
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-400">
          <div className="col-span-1">Set</div>
          <div className="col-span-4 sm:col-span-3">Weight</div>
          <div className="col-span-3">Reps</div>
          <div className="col-span-4 sm:col-span-5">Notes</div>
        </div>

        {exercise.sets.map((set, setIndex) => (
          <div key={setIndex} className="grid grid-cols-12 gap-2 mb-2 items-center">
            <div className="col-span-1 text-center font-medium">{set.order}</div>
            <div className="col-span-4 sm:col-span-3">
              <div className="flex">
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  value={set.weight || ''}
                  onChange={(e) => onUpdateSet(setIndex, 'weight', e.target.value ? Number(e.target.value) : null)}
                />
                <span className="ml-1 flex items-center text-gray-400">lbs</span>
              </div>
            </div>
            <div className="col-span-3">
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                value={set.reps || ''}
                onChange={(e) => onUpdateSet(setIndex, 'reps', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="col-span-4 sm:col-span-5 flex items-center gap-2">
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Notes"
                value={set.notes || ''}
                onChange={(e) => onUpdateSet(setIndex, 'notes', e.target.value || null)}
              />
              {exercise.sets.length > 1 && (
                <button 
                  className="p-1 text-gray-400 hover:text-red-500"
                  onClick={() => onRemoveSet(setIndex)}
                >
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
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        <button 
          className="mt-2 flex items-center text-sm text-primary hover:underline"
          onClick={onAddSet}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add Set
        </button>
      </div>
    </div>
  );
}
