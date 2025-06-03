import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Admin accounts - only Logan Main account should have admin access
  const isAdmin = user && user.username === "Logan Main";
  // Check if user is a coach
  const isCoach = user && user.isCoach === true;
  
  const links = [
    { 
      href: '/', 
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    { 
      href: '/workouts', 
      label: 'Workouts',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" strokeWidth="2.2" />
          <rect x="1" y="8.5" width="2.6" height="7" rx="1.3" fill="currentColor" />
          <rect x="20.4" y="8.5" width="2.6" height="7" rx="1.3" fill="currentColor" />
          <rect x="4.5" y="10" width="2" height="4" rx="1" fill="currentColor" />
          <rect x="17.5" y="10" width="2" height="4" rx="1" fill="currentColor" />
        </svg>
      )
    },
    
    { 
      href: '/messages', 
      label: 'Messages',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    { 
      href: '/marketplace', 
      label: 'Marketplace',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          <path d="M2 7h20"/>
          <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
        </svg>
      )
    },
    // Only show Coach features for coaches
    ...(isCoach ? [
      {
        href: '/coach-dashboard', 
        label: 'Dashboard',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
        )
      },
      {
        href: '/my-plans', 
        label: 'My Plans',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="m9 14 2 2 4-4"></path>
          </svg>
        )
      }
    ] : []),
    // Only show Admin link if user has admin privileges (username "Logan Main")
    ...(isAdmin ? [{
      href: '/admin',
      label: 'Admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5Z"></path>
          <path d="M16 8V4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-2.96 3.08 2.5 2.5 0 0 1-4.91.05L16 20V8Z"></path>
          <path d="M12 4.5V20"></path>
        </svg>
      )
    }] : []),
  ];
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-100" data-tour="navigation">
      <div className="container mx-auto px-4">
        <div 
          className="flex items-center overflow-x-auto hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {links.map((link) => {
            const isActive = location === link.href;
            
            // Add data-tour attributes for onboarding
            const getTourAttribute = () => {
              if (link.href === '/marketplace') return 'marketplace';
              if (link.href === '/messages') return 'messages';
              if (link.href === '/') return 'dashboard';
              return undefined;
            };

            return (
              <Link 
                key={link.href} 
                href={link.href}
                data-tour={getTourAttribute()}
                className={`flex items-center gap-2 px-4 py-3.5 whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'text-primary font-medium relative bg-primary/5'
                    : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <span className={`${isActive 
                  ? 'text-primary scale-110 transition-transform duration-200' 
                  : 'text-gray-400'}`}
                >
                  {link.icon}
                </span>
                <span className={`${isActive ? 'font-semibold' : ''}`}>
                  {link.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/70 rounded-t"></span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
