'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

interface UserData {
  email: string;
  profilePicture?: string;
  stripeAccount?: {
    individual?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Get page title based on current route
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/gifts': return 'Cadeaus';
      case '/recipients': return 'Ontvangers';
      case '/settings': return 'Instellingen';
      case '/analytics': return 'Analytics';
      case '/admin': return 'Admin';
      default: return 'MonnieGift';
    }
  };

  // Load user data from localStorage and fetch from API
  useEffect(() => {
    const loadUserData = () => {
      const email = localStorage.getItem('userEmail') || '';
      const profilePicture = localStorage.getItem('profilePicture') || '';
      setUserEmail(email);
      setUserProfilePicture(profilePicture);

      // Fetch user data if we have an email
      if (email) {
        fetchUserData(email);
      } else {
        // Clear user data if no email
        setUserData(null);
      }
      
      // Mark loading as complete
      setIsLoading(false);
    };

    // Load initial data
    loadUserData();

    // Listen for storage changes (when user signs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail' || e.key === 'profilePicture') {
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (when user signs in/out in same tab)
    const handleAuthChange = () => {
      loadUserData();
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const fetchUserData = async (email: string) => {
    // Simplified user data loading - just set basic info from localStorage
    // No need for dashboard API call since dashboard page was removed
    setUserData({
      email,
      profilePicture: userProfilePicture,
    });
  };

  // Check if current page should hide sidebar and header
  const hideLayout = pathname === '/' || pathname === '/success' || pathname.startsWith('/claim/') || pathname === '/onboard' || pathname.startsWith('/onboard/');

  if (hideLayout) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen">

      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
