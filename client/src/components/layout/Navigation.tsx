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
      href: '/nutrition', 
      label: 'Nutrition',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11 8 11 1 0 8-5.6 8-11a8 8 0 0 0-8-8Z"></path>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
        </svg>
      )
    },
    { 
      href: '/progress', 
      label: 'Progress',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"></path>
          <path d="m19 9-5 5-4-4-3 3"></path>
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
