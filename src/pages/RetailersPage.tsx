"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import RetailerForm from '../components/RetailerForm';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';

interface Retailer {
  id: string;
  name: string;
  contact_email: string | null;
  admin_id: string;
  created_at: string;
}

const RetailersPage = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loadingRetailers, setLoadingRetailers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddRetailerDialogOpen, setIsAddRetailerDialogOpen] = useState(false);
  const [isEditRetailerDialogOpen, setIsEditRetailerDialogOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);

  React.useEffect(() => {
    if (!isLoading && (!session || profile?.role !== 'admin')) {
      navigate('/login');
    }
  }, [session, profile, isLoading, navigate]);

  const fetchRetailers = async () => {
    if (session && profile?.role === 'admin') {
      setLoadingRetailers(true);
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('admin_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching retailers:', error);
        setError('Failed to load retailers.');
        setRetailers([]);
      } else {
        setRetailers(data || []);
      }
      setLoadingRetailers(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, [session, profile]);

  const handleRetailerSaved = () => {
    fetchRetailers(); // Refresh the list after a new retailer is added or edited
    setIsAddRetailerDialogOpen(false); // Close add dialog
    setIsEditRetailerDialogOpen(false); // Close edit dialog
    setSelectedRetailer(null); // Clear selected retailer
  };

  const handleDeleteRetailer = async (retailerId: string) => {
    if (!session?.user?.id) {
      console.error("User not authenticated.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this retailer? This action cannot be undone.")) {
      const toastId = showLoading("Deleting retailer...");
      try {
        const { error } = await supabase
          .from('retailers')
          .delete()
          .eq('id', retailerId)
          .eq('admin_id', session.user.id); // Ensure only admin can delete their own retailer

        if (error) {
          throw error;
        }

        showSuccess("Retailer deleted successfully!");
        fetchRetailers(); // Refresh the list
      } catch (error: any) {
        console.error("Error deleting retailer:", error);
        showError(`Failed to delete retailer: ${error.message || 'Unknown error'}`);
      } finally {
        dismissToast(toastId);
      }
    }
  };

  const handleEditClick = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setIsEditRetailerDialogOpen(true);
  };

  if (isLoading || loadingRetailers || !session || profile?.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen text-lg">Loading Retailers...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 text-lg">{error}</div>;
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
              <Link to="/admin/retailers" className="block px-4 py-2 rounded-md bg-gray-700 transition-colors">
                Retailers
              </Link>
            </li>
            {/* Add more admin links here */}
          </ul>
        </nav>
        <Button
          onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mt-auto"
          variant="destructive"
        >
          Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Retailer Management</h1>
          <div className="flex justify-end mb-4">
            <Dialog open={isAddRetailerDialogOpen} onOpenChange={setIsAddRetailerDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Retailer</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Retailer</DialogTitle>
                </DialogHeader>
                <RetailerForm onRetailerSaved={handleRetailerSaved} onClose={() => setIsAddRetailerDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {retailers.length === 0 ? (
            <p className="text-gray-600">No retailers found. Add your first retailer!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Contact Email</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {retailers.map((retailer) => (
                    <tr key={retailer.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{retailer.name}</td>
                      <td className="py-2 px-4 border-b">{retailer.contact_email || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(retailer)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRetailer(retailer.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Retailer Dialog */}
      <Dialog open={isEditRetailerDialogOpen} onOpenChange={setIsEditRetailerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Retailer</DialogTitle>
          </DialogHeader>
          {selectedRetailer && (
            <RetailerForm
              initialRetailer={selectedRetailer}
              onRetailerSaved={handleRetailerSaved}
              onClose={() => setIsEditRetailerDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RetailersPage;