"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button'; // Import Button for logout

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();

  const [productCount, setProductCount] = useState(0);
  const [retailerCount, setRetailerCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [userCount, setUserCount] = useState(0); // Count of other users (retailers)

  React.useEffect(() => {
    if (!isLoading && (!session || profile?.role !== 'admin')) {
      navigate('/login');
    }
  }, [session, profile, isLoading, navigate]);

  const fetchDashboardData = async () => {
    if (session && profile?.role === 'admin') {
      const adminId = session.user.id;

      // Fetch product count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', adminId);
      if (!productsError) setProductCount(productsCount || 0);

      // Fetch retailer count
      const { count: retailersCount, error: retailersError } = await supabase
        .from('retailers')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', adminId);
      if (!retailersError) setRetailerCount(retailersCount || 0);

      // Fetch product assignment count
      const { count: assignmentsCount, error: assignmentsError } = await supabase
        .from('product_retailers')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_by_admin_id', adminId);
      if (!assignmentsError) setAssignmentCount(assignmentsCount || 0);

      // Fetch other user (retailer) count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('id', adminId) // Exclude the current admin
        .eq('role', 'retailer'); // Only count retailers
      if (!usersError) setUserCount(usersCount || 0);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [session, profile]);

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
              <Link to="/admin-dashboard" className="block px-4 py-2 rounded-md bg-gray-700 transition-colors">
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
            <li>
              <Link to="/profile" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Profile
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold">Total Products</h3>
              <p className="text-4xl font-bold mt-2">{productCount}</p>
            </div>
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold">Total Retailers</h3>
              <p className="text-4xl font-bold mt-2">{retailerCount}</p>
            </div>
            <div className="bg-purple-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold">Product Assignments</h3>
              <p className="text-4xl font-bold mt-2">{assignmentCount}</p>
            </div>
            <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold">Other Users (Retailers)</h3>
              <p className="text-4xl font-bold mt-2">{userCount}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;