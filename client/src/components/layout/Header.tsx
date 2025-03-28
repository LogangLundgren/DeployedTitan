import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // In a real app, this would check for an authenticated session
  // For now, we'll just fetch the demo user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/demo'],
    queryFn: () => ({ id: 1, username: 'demo', name: 'John Smith', email: 'demo@example.com', password: '' })
  });
  
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Titan Fitness</h1>
        
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>
          
          <div className="relative">
            <button 
              className="flex items-center gap-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'JS'}
              </div>
              <span>{user?.name || 'John Smith'}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Settings</a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Logout</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
