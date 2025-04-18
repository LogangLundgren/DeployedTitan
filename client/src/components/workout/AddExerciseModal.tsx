import { useState } from "react";
import { Exercise } from "@shared/schema";
import ManageExercisesModal from "./ManageExercisesModal";
import CustomExerciseModal from "./CustomExerciseModal";
import { useQueryClient } from "@tanstack/react-query";

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onAddExercise: (exercise: Exercise) => void;
}

export default function AddExerciseModal({ isOpen, onClose, exercises, onAddExercise }: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const categories = Array.from(new Set(exercises.map(e => e.category)));
  
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? exercise.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });
  
  // Handle refreshing exercises after creation or deletion
  const handleExerciseActionCompleted = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Add Exercise</h3>
          <button className="p-1 text-gray-400 hover:text-gray-500" onClick={onClose}>
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
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="search-exercise" className="block text-sm font-medium text-gray-400 mb-1">Search Exercises</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  className="text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input 
                type="text" 
                id="search-exercise"
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              <button 
                className={`px-3 py-1 ${selectedCategory === null ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 hover:bg-primary/10 hover:text-primary'} rounded-full text-sm`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(category => (
                <button 
                  key={category}
                  className={`px-3 py-1 ${selectedCategory === category ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 hover:bg-primary/10 hover:text-primary'} rounded-full text-sm`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredExercises.length > 0 ? (
              filteredExercises.map(exercise => (
                <div 
                  key={exercise.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-md cursor-pointer"
                  onClick={() => onAddExercise(exercise)}
                >
                  <div>
                    <h4 className="font-medium">{exercise.name}</h4>
                    <p className="text-sm text-gray-400">{exercise.category} • {exercise.subcategory}</p>
                  </div>
                  <button className="text-primary">
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
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400">
                No exercises found
              </div>
            )}
          </div>
          
          <div className="border-t mt-4 pt-4">
            <CustomExerciseModal 
              onExerciseCreated={handleExerciseActionCompleted}
            />
          </div>
        </div>
        
        <div className="border-t p-4 flex justify-between gap-3">
          <div>
            <ManageExercisesModal 
              exercises={exercises} 
              onExerciseDeleted={handleExerciseActionCompleted} 
            />
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 text-gray-400 hover:bg-gray-100 rounded-md"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
