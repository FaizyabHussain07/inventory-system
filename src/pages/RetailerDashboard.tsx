"use client";

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';
import RetailerProductList from '../components/RetailerProductList'; // Import the new component
import { Button } from '../components/ui/button';

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();

  React.useEffect(() => {
    if (!isLoading && (!session || profile?.role !== 'retailer')) {
      navigate('/login');
    }
  }, [session, profile, isLoading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isLoading || !session || profile?.role !== 'retailer') {
    return <div className="flex justify-center items-center h-screen text-lg">Loading Retailer Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-4">
      <header className="w-full bg-white p-4 rounded-lg shadow-md flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, Retailer {profile?.first_name || session.user?.email}!</h1>
        <Button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          variant="destructive"
        >
          Logout
        </Button>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto">
        <RetailerProductList />
      </main>
      {/* Sidebar for Retailer Dashboard */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-6 fixed right-0 top-0 h-full hidden md:block">
        <h2 className="text-2xl font-bold mb-6">Retailer Panel</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link to="/retailer-dashboard" className="block px-4 py-2 rounded-md bg-gray-700 transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/profile" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Profile
              </Link>
            </li>
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
    </div>
  );
};

export default RetailerDashboard;