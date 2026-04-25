import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { COMPANY_LOGO, THEME } from '../constants';

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('user_token');
  
  const handleLogout = () => {
    localStorage.removeItem('user_token');
    navigate('/login');
  };

  return (
    <nav className="sticky z-[60] bg-white border-b border-gray-200 shadow-sm" style={{ top: 'var(--qobo-banner-height, 0px)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img src={settings?.site_logo || COMPANY_LOGO} alt="Logo" className="h-10 w-10" />
            <span className="text-xl font-bold" style={{ color: THEME.colors.primary }}>{settings?.site_name || 'ID Card Portal'}</span>
          </Link>

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary transition-colors">Dashboard</Link>
                <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary transition-colors">Login</Link>
                <Link to="/signup" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden py-4 space-y-2">
            <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Dashboard</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Login</Link>
                <Link to="/signup" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}