"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { SessionContextProvider, useSession } from './components/SessionContextProvider';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import ProductsPage from './pages/ProductsPage';
import RetailersPage from './pages/RetailersPage';
import ProductAssignmentsPage from './pages/ProductAssignmentsPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage'; // Import the new ProfilePage
import './index.css'; // Ensure Tailwind CSS is imported

// A wrapper component to handle redirects based on session and role
const AuthRedirect = () => {
  const { session, profile, isLoading } = useSession();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading) {
      if (!session) {
        navigate('/login');
      } else if (profile) {
        if (profile.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (profile.role === 'retailer') {
          navigate('/retailer-dashboard');
        } else {
          // Handle cases where role is not set or unknown, maybe redirect to a profile setup page
          console.warn("User role not defined, redirecting to login.");
          navigate('/login');
        }
      }
    }
  }, [session, profile, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading application...</div>;
  }

  return null; // This component only handles redirects
};

function App() {
  return (
    <Router>
      <SessionContextProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/retailers" element={<RetailersPage />} />
          <Route path="/admin/product-assignments" element={<ProductAssignmentsPage />} />
          <Route path="/admin/user-management" element={<UserManagementPage />} />
          <Route path="/retailer-dashboard" element={<RetailerDashboard />} />
          <Route path="/profile" element={<ProfilePage />} /> {/* New route */}
          <Route path="/" element={<AuthRedirect />} /> {/* Default route to handle initial redirect */}
        </Routes>
      </SessionContextProvider>
    </Router>
  );
}

export default App;