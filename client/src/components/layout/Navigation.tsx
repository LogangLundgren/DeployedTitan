import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();
  
  const links = [
    { 
      href: '/', 
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      )
    },
    { 
      href: '/workouts', 
      label: 'Workouts',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" x2="6" y1="1" y2="4"></line>
          <line x1="10" x2="10" y1="1" y2="4"></line>
          <line x1="14" x2="14" y1="1" y2="4"></line>
        </svg>
      )
    },
    { 
      href: '/templates', 
      label: 'Templates',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
          <path d="M9 16.2v5"></path>
          <path d="M15 16.2v5"></path>
          <path d="M9 2v5"></path>
          <path d="M15 2v5"></path>
          <path d="M15 14a3 3 0 0 0-6 0"></path>
        </svg>
      )
    },
    { 
      href: '/goals', 
      label: 'Goals',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4" />
          <path d="m4 4 2 2" />
          <path d="M2 12h4" />
          <path d="m4 20 2-2" />
          <path d="M12 18v4" />
          <path d="m18 20 2-2" />
          <path d="M22 12h-4" />
          <path d="m18 4 2 2" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    },
    { 
      href: '/social', 
      label: 'Social',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    { 
      href: '/marketplace', 
      label: 'Marketplace',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      )
    },
    { 
      href: '/my-plans', 
      label: 'My Plans',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="m9 10 2 2 4-4" />
        </svg>
      )
    },
    { 
      href: '/profile', 
      label: 'Profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
  ];
  
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div 
          className="flex items-center overflow-x-auto hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {links.map((link) => {
            const isActive = location === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-2 px-4 py-3.5 whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? 'text-primary font-medium relative'
                    : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <span className={`${isActive ? 'text-primary' : 'text-gray-400'}`}>
                  {link.icon}
                </span>
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
