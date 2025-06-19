/**
 * 💪 WORKOUT TRACKING COMPONENT
 * Track workouts, exercises, sets, and progress
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Timer, 
  Dumbbell, 
  TrendingUp,
  Calendar,
  Target,
  Award,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const WorkoutTracker = ({ memberId, className = '' }) => {
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [loading, setLoading] = useState(true);

  // Workout templates
  const workoutTemplates = [
    {
      id: 'push',
      name: 'Push Day',
      category: 'Strength',
      exercises: [
        { name: 'Bench Press', sets: 3, reps: '8-10', weight: null },
        { name: 'Shoulder Press', sets: 3, reps: '10-12', weight: null },
        { name: 'Push-ups', sets: 3, reps: '12-15', weight: null },
        { name: 'Tricep Dips', sets: 3, reps: '10-12', weight: null },
      ]
    },
    {
      id: 'pull',
      name: 'Pull Day',
      category: 'Strength',
      exercises: [
        { name: 'Pull-ups', sets: 3, reps: '6-8', weight: null },
        { name: 'Bent-over Row', sets: 3, reps: '8-10', weight: null },
        { name: 'Lat Pulldown', sets: 3, reps: '10-12', weight: null },
        { name: 'Bicep Curls', sets: 3, reps: '12-15', weight: null },
      ]
    },
    {
      id: 'cardio',
      name: 'Cardio Session',
      category: 'Cardio',
      exercises: [
        { name: 'Treadmill', sets: 1, reps: '30 min', weight: null },
        { name: 'Cycling', sets: 1, reps: '20 min', weight: null },
        { name: 'Rowing', sets: 1, reps: '15 min', weight: null },
      ]
    }
  ];

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // Load workouts
  useEffect(() => {
    loadWorkouts();
  }, [memberId]);

  const loadWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('member_workouts')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start new workout
  const startWorkout = (template) => {
    const newWorkout = {
      id: Date.now(),
      name: template.name,
      category: template.category,
      exercises: template.exercises.map(ex => ({
        ...ex,
        completed: false,
        actualSets: []
      })),
      startTime: new Date(),
      duration: 0,
      status: 'active'
    };

    setActiveWorkout(newWorkout);
    setIsTracking(true);
    setWorkoutTimer(0);
    
    toast({
      title: 'Workout started',
      description: `Started ${template.name} workout`,
    });
  };

  // Complete exercise set
  const completeSet = (exerciseIndex, setData) => {
    if (!activeWorkout) return;

    const updatedWorkout = { ...activeWorkout };
    const exercise = updatedWorkout.exercises[exerciseIndex];
    
    exercise.actualSets.push({
      reps: setData.reps,
      weight: setData.weight,
      restTime: setData.restTime || 60,
      completedAt: new Date()
    });

    // Mark exercise as completed if all sets are done
    if (exercise.actualSets.length >= exercise.sets) {
      exercise.completed = true;
    }

    setActiveWorkout(updatedWorkout);
  };

  // Finish workout
  const finishWorkout = async () => {
    if (!activeWorkout) return;

    try {
      const workoutData = {
        member_id: memberId,
        name: activeWorkout.name,
        category: activeWorkout.category,
        duration: workoutTimer,
        exercises: activeWorkout.exercises,
        completed_at: new Date(),
        notes: ''
      };

      const { error } = await supabase
        .from('member_workouts')
        .insert([workoutData]);

      if (error) throw error;

      setWorkouts(prev => [workoutData, ...prev]);
      setActiveWorkout(null);
      setIsTracking(false);
      setWorkoutTimer(0);

      toast({
        title: 'Workout completed',
        description: `Great job! Workout saved successfully.`,
      });

    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: 'Error saving workout',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate workout stats
  const getWorkoutStats = () => {
    const thisWeek = workouts.filter(w => {
      const workoutDate = new Date(w.completed_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    });

    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = workouts.length > 0 ? Math.round(totalDuration / workouts.length / 60) : 0;

    return {
      thisWeek: thisWeek.length,
      total: workouts.length,
      avgDuration
    };
  };

  const stats = getWorkoutStats();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Workout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.thisWeek}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.avgDuration}</div>
            <div className="text-sm text-gray-600">Avg Duration (min)</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Workout */}
      {activeWorkout && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {activeWorkout.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {formatTime(workoutTimer)}
                </Badge>
                <Button
                  size="sm"
                  onClick={isTracking ? () => setIsTracking(false) : () => setIsTracking(true)}
                  variant="outline"
                >
                  {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" onClick={finishWorkout} variant="default">
                  <Square className="h-4 w-4 mr-1" />
                  Finish
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeWorkout.exercises.map((exercise, index) => (
                <ExerciseTracker
                  key={index}
                  exercise={exercise}
                  onSetComplete={(setData) => completeSet(index, setData)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Templates */}
      {!activeWorkout && (
        <Card>
          <CardHeader>
            <CardTitle>Start a Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workoutTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => startWorkout(template)}
                  >
                    <CardContent className="p-4 text-center">
                      <Dumbbell className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.category}</p>
                      <Badge variant="outline" className="mt-2">
                        {template.exercises.length} exercises
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workouts recorded yet</p>
              <p className="text-sm">Start your first workout above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.slice(0, 5).map((workout, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{workout.name}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(workout.completed_at).toLocaleDateString()} • {Math.round(workout.duration / 60)} min
                    </p>
                  </div>
                  <Badge variant="outline">{workout.category}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Exercise Tracker Component
const ExerciseTracker = ({ exercise, onSetComplete }) => {
  const [currentSet, setCurrentSet] = useState(1);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleSetComplete = () => {
    if (!reps) return;

    onSetComplete({
      reps: parseInt(reps),
      weight: weight ? parseFloat(weight) : null,
      setNumber: currentSet
    });

    setCurrentSet(prev => prev + 1);
    setReps('');
    setWeight('');
  };

  const completedSets = exercise.actualSets?.length || 0;
  const progress = (completedSets / exercise.sets) * 100;

  return (
    <div className={cn(
      'p-4 border rounded-lg',
      exercise.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50'
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">{exercise.name}</h4>
        <Badge variant={exercise.completed ? 'default' : 'outline'}>
          {completedSets}/{exercise.sets} sets
        </Badge>
      </div>

      <Progress value={progress} className="mb-3" />

      {!exercise.completed && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor={`reps-${exercise.name}`} className="text-xs">Reps</Label>
            <Input
              id={`reps-${exercise.name}`}
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={exercise.reps}
              className="h-8"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`weight-${exercise.name}`} className="text-xs">Weight (lbs)</Label>
            <Input
              id={`weight-${exercise.name}`}
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>
          <Button size="sm" onClick={handleSetComplete} disabled={!reps}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;
