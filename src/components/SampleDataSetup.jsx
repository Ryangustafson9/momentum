// 🚀 SPRINT 1: SAMPLE DATA SETUP COMPONENT
// Helps users populate their dashboard with sample data for testing

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { setupSampleDataForUser } from '@/scripts/seedDashboardData';

const SampleDataSetup = ({ onComplete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);

  const handleSetupSampleData = async () => {
    if (!user) {
      setError('No user found. Please log in first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await setupSampleDataForUser(user);
      
      if (success) {
        setCompleted(true);
        // Call the completion callback after a short delay
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      } else {
        setError('Failed to set up sample data. Please try again.');
      }
    } catch (err) {
      console.error('Sample data setup error:', err);
      setError('An error occurred while setting up sample data.');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Sample Data Setup Complete!
          </h3>
          <p className="text-green-700 mb-4">
            Your dashboard now has sample classes, membership, and attendance data.
          </p>
          <Badge variant="outline" className="text-green-700 border-green-300">
            Refreshing dashboard...
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-900">
          <Database className="mr-2 h-5 w-5" />
          Set Up Sample Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-blue-800">
            To see your dashboard in action, we can set up some sample data including:
          </p>
          
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Sample fitness classes (Yoga, HIIT, Strength Training)
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Active membership with billing information
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Attendance history (80% attendance rate)
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              User profile completion
            </li>
          </ul>

          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="pt-4">
            <Button 
              onClick={handleSetupSampleData}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up sample data...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Set Up Sample Data
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-blue-600">
            This will only create data if it doesn't already exist. Safe to run multiple times.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleDataSetup;
