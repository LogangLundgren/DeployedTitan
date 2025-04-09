import { useState } from "react";
import { User } from "@shared/schema";
import { Link } from "wouter";
import { NotificationDropdown } from "../notifications/NotificationDropdown";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Demo user data with all required fields
  const user: User = {
    id: 1,
    username: 'demo',
    name: 'John Smith',
    email: 'demo@example.com',
    password: '',
    bio: null,
    location: null,
    fitnessLevel: null,
    experienceYears: null,
    goals: null,
    certifications: null,
    socialMedia: null
  };
  
  return (
    <header className="bg-gradient-to-r from-primary to-primary/90 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
          >
            <path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1z"/>
            <path d="M14 6v13a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1z"/>
            <path d="M21 4v15a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1z"/>
          </svg>
          <h1 className="text-2xl font-bold tracking-tight">Titan Fitness</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          
          <div className="relative">
            <button 
              className="flex items-center gap-2 hover:bg-white/10 py-1.5 px-2 rounded-lg transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
                {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'JS'}
              </div>
              <span className="font-medium">{user?.name || 'John Smith'}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg py-1.5 z-10 border border-gray-100">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'demo@example.com'}</p>
                </div>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Profile</span>
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <a href="#" className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Logout</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
