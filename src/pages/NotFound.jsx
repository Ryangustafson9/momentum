import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin' || user.role === 'staff') {
      navigate('/staff-portal/dashboard');
    } else if (user.role === 'member') {
      navigate('/member-portal/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">Page not found</p>
      <Button onClick={handleGoHome}>
        {user ? 'Go to Dashboard' : 'Go to Login'}
      </Button>
    </div>
  );
};

export default NotFound;


