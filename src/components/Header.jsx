// src/components/Header.jsx
import { useAuth } from '@/contexts/AuthContext';
import { getNavigationForRole } from '@/utils/routeUtils';
import { normalizeRole, getDefaultRoute } from '@/utils/roleUtils';

const Header = () => {
  const { user, authReady, logout } = useAuth();
  
  const userRole = normalizeRole(user?.role);
  const navigationItems = getNavigationForRole(userRole);
  const defaultRoute = getDefaultRoute(userRole);

  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">Momentum Fitness</h1>
        
        <div className="flex items-center space-x-4">
          {!authReady ? (
            <div className="animate-pulse text-gray-500">Loading...</div>
          ) : user ? (
            <>
              <span className="text-gray-700">
                Welcome, {user.first_name || user.display_name || 'User'}!
              </span>
              
              {/* SIMPLIFIED: Use default route from utils */}
              <a href={defaultRoute} className="text-blue-600 hover:underline">
                Dashboard
              </a>
              
              <button 
                onClick={logout} 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <a 
              href="/login" 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;



