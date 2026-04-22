import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QoboBanner } from '@qobo/banner';
import { AdminProtectedRoute, initializeAdminAuthFromUrl } from '@qobo/admin-auth';
import { SettingsProvider } from './contexts/SettingsContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ConfigurationPage from './pages/ConfigurationPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentFormPage from './pages/admin/StudentFormPage';
import ReviewPage from './pages/admin/ReviewPage';
import AdminLayout from './components/admin/AdminLayout';

if (typeof window !== 'undefined' && import.meta.env.VITE_PROJECT_ID) {
  if (!window.QOBO_CONFIG) window.QOBO_CONFIG = {};
  window.QOBO_CONFIG.projectId = import.meta.env.VITE_PROJECT_ID;
}

export default function App() {
  useEffect(() => {
    initializeAdminAuthFromUrl();
  }, []);

  return (
    <SettingsProvider>
      <BrowserRouter>
        <QoboBanner apiKey={import.meta.env.VITE_API_KEY} apiBaseUrl={import.meta.env.VITE_API_BASE_URL} />
        <Navigation />
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/configuration" element={<ConfigurationPage />} />
              <Route path="/admin/*" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="students/new" element={<StudentFormPage />} />
                <Route path="review" element={<ReviewPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </SettingsProvider>
  );
}