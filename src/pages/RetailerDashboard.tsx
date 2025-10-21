"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    </div>
  );
};

export default RetailerDashboard;