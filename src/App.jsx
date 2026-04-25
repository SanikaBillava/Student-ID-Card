import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QoboBanner } from "@qobo/banner";

import { SettingsProvider } from "./contexts/SettingsContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import ConfigurationPage from "./pages/ConfigurationPage";
import SchoolOnboardingPage from "./pages/SchoolOnboardingPage";
import AgentDashboard from "./pages/AgentDashboard";
import SchoolDashboard from "./pages/school/Dashboard";
import StudentFormPage from "./pages/school/StudentFormPage";
import ReviewPage from "./pages/school/ReviewPage";
import CreateBatch from "./pages/school/CreateBatch";
import AgentOverviewPage from "./pages/agent/OverviewPage";
import AgentAllSchoolsPage from "./pages/agent/AllSchoolsPage";
import AgentStudentsDataPage from "./pages/agent/StudentsDataPage";
import Layout from "./components/dashboard/Layout";

if (typeof window !== "undefined" && import.meta.env.VITE_PROJECT_ID) {
  if (!window.QOBO_CONFIG) window.QOBO_CONFIG = {};
  window.QOBO_CONFIG.projectId = import.meta.env.VITE_PROJECT_ID;
}

function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");
  const role = localStorage.getItem("role");

  if (!userId) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRole && role && role !== allowedRole) {
    return <Navigate to={role === "agent" ? "/agent" : "/school"} replace />;
  }

  return children;
}

function RoleRedirect() {
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_token");
  const role = localStorage.getItem("role");

  if (!userId) return <Navigate to="/login" replace />;
  return <Navigate to={role === "agent" ? "/agent" : "/school"} replace />;
}

export default function App() {
  useEffect(() => {
    // initializeAdminAuthFromUrl();
  }, []);

  return (
    <SettingsProvider>
      <BrowserRouter>
        <QoboBanner
          apiKey={import.meta.env.VITE_API_KEY}
          apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
        />
        <Navigation />
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/configuration" element={<ConfigurationPage />} />
              <Route
                path="/school-onboarding"
                element={
                  <ProtectedRoute allowedRole="school">
                    <SchoolOnboardingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent-dashboard"
                element={
                  <ProtectedRoute allowedRole="agent">
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/school*"
                element={
                  <ProtectedRoute allowedRole="school">
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SchoolDashboard />} />
                <Route path="students/new" element={<StudentFormPage />} />
                <Route path="review" element={<ReviewPage />} />
                <Route path="batches/new" element={<CreateBatch />} />
              </Route>
              <Route
                path="/agent/*"
                element={
                  <ProtectedRoute allowedRole="agent">
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AgentOverviewPage />} />
                <Route path="schools" element={<AgentAllSchoolsPage />} />
                <Route path="students" element={<AgentStudentsDataPage />} />
              </Route>
              <Route path="/dashboard/*" element={<RoleRedirect />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </SettingsProvider>
  );
}
