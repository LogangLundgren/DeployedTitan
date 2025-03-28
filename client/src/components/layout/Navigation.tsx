import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();
  
  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/programs', label: 'Programs' },
    { href: '/workouts', label: 'Workouts' },
    { href: '/nutrition', label: 'Nutrition' },
    { href: '/progress', label: 'Progress' },
    { href: '/settings', label: 'Settings' },
  ];
  
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={`px-4 py-4 whitespace-nowrap ${
                  location === link.href
                    ? 'text-primary border-b-2 border-primary font-medium'
                    : 'text-gray-400 hover:text-primary'
                }`}
              >
                {link.label}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
