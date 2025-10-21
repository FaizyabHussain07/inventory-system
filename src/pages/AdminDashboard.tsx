"use client";

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button'; // Import Button for logout

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();

  React.useEffect(() => {
    if (!isLoading && (!session || profile?.role !== 'admin')) {
      navigate('/login');
    }
  }, [session, profile, isLoading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isLoading || !session || profile?.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen text-lg">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-6">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link to="/admin-dashboard" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/products" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Products
              </Link>
            </li>
            <li>
              <Link to="/admin/retailers" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Retailers
              </Link>
            </li>
            <li>
              <Link to="/admin/product-assignments" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Product Assignments
              </Link>
            </li>
            <li>
              <Link to="/admin/user-management" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                User Management
              </Link>
            </li>
            {/* Add more admin links here */}
          </ul>
        </nav>
        <Button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mt-auto"
          variant="destructive"
        >
          Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, Admin {profile?.first_name || session.user?.email}!</h1>
          <p className="text-gray-600 mb-6">This is your Admin Dashboard overview.</p>
          {/* Dashboard content will go here */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;