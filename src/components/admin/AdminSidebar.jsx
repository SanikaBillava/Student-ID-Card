import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, CheckCircle } from 'lucide-react';

export default function AdminSidebar({ onNavigate }) {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/dashboard/students/new', icon: UserPlus, label: 'Add Student' },
    { path: '/dashboard/review', icon: CheckCircle, label: 'Review & Submit' }
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <Link key={item.path} to={item.path} onClick={onNavigate} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}