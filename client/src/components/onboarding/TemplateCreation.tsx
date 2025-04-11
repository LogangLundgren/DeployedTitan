import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Dumbbell, Clock } from "lucide-react";

interface TemplateCreationProps {
  onComplete: () => void;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime?: number;
}

export default function TemplateCreation({ onComplete }: TemplateCreationProps) {
  const [templateName, setTemplateName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: "1", name: "", sets: 3, reps: 10, weight: 0, restTime: 60 },
  ]);

  const addExercise = () => {
    const newId = String(Date.now());
    setExercises([
      ...exercises,
      { id: newId, name: "", sets: 3, reps: 10, weight: 0, restTime: 60 },
    ]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const isValid = 
    templateName.trim() !== "" && 
    exercises.length > 0 && 
    exercises.every(ex => ex.name.trim() !== "");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Create Your First Workout Template</h3>
        <p className="text-sm text-muted-foreground">
          Start by creating a simple workout template. You can add more exercises
          and customize it later.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            placeholder="e.g., Full Body Workout, Upper Body, Leg Day, etc."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Exercises</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={addExercise}
              className="h-8 gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Exercise
            </Button>
          </div>

          <div className="space-y-3">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="overflow-hidden">
                <CardHeader className="p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Input
                      className="text-sm font-medium border-0 bg-transparent px-0 h-auto"
                      placeholder="Exercise Name (e.g., Bench Press, Squat)"
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(exercise.id, "name", e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExercise(exercise.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={exercises.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`sets-${exercise.id}`} className="text-xs flex items-center gap-1">
                      <span className="hidden md:inline">Sets</span>
                      <span className="md:hidden">S</span>
                    </Label>
                    <Input
                      id={`sets-${exercise.id}`}
                      type="number"
                      min="1"
                      value={exercise.sets}
                      onChange={(e) =>
                        updateExercise(
                          exercise.id,
                          "sets",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`reps-${exercise.id}`} className="text-xs flex items-center gap-1">
                      <span className="hidden md:inline">Reps</span>
                      <span className="md:hidden">R</span>
                    </Label>
                    <Input
                      id={`reps-${exercise.id}`}
                      type="number"
                      min="1"
                      value={exercise.reps}
                      onChange={(e) =>
                        updateExercise(
                          exercise.id,
                          "reps",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`weight-${exercise.id}`} className="text-xs flex items-center gap-1">
                      <span className="hidden md:inline">Weight</span>
                      <span className="md:hidden">W</span>
                      <Dumbbell className="h-3 w-3" />
                    </Label>
                    <Input
                      id={`weight-${exercise.id}`}
                      type="number"
                      min="0"
                      value={exercise.weight}
                      onChange={(e) =>
                        updateExercise(
                          exercise.id,
                          "weight",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`rest-${exercise.id}`} className="text-xs flex items-center gap-1">
                      <span className="hidden md:inline">Rest</span>
                      <span className="md:hidden">Rst</span>
                      <Clock className="h-3 w-3" />
                    </Label>
                    <Input
                      id={`rest-${exercise.id}`}
                      type="number"
                      min="0"
                      value={exercise.restTime}
                      onChange={(e) =>
                        updateExercise(
                          exercise.id,
                          "restTime",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}