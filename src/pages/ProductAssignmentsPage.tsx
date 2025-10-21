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
import ProductAssignmentForm from '../components/ProductAssignmentForm';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';

interface ProductAssignment {
  product_id: string;
  retailer_id: string;
  assigned_by_admin_id: string;
  retailer_sale_price_per_unit: number;
  retailer_current_stock_units: number;
  retailer_last_updated_at: string;
  assigned_at: string;
  products: { name: string } | null;
  retailers: { name: string } | null;
}

const ProductAssignmentsPage = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();
  const [assignments, setAssignments] = useState<ProductAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddAssignmentDialogOpen, setIsAddAssignmentDialogOpen] = useState(false);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ProductAssignment | null>(null);

  React.useEffect(() => {
    if (!isLoading && (!session || profile?.role !== 'admin')) {
      navigate('/login');
    }
  }, [session, profile, isLoading, navigate]);

  const fetchAssignments = async () => {
    if (session && profile?.role === 'admin') {
      setLoadingAssignments(true);
      const { data, error } = await supabase
        .from('product_retailers')
        .select(`
          *,
          products (name),
          retailers (name)
        `)
        .eq('assigned_by_admin_id', session.user.id)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching product assignments:', error);
        setError('Failed to load product assignments.');
        setAssignments([]);
      } else {
        setAssignments(data || []);
      }
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [session, profile]);

  const handleAssignmentSaved = () => {
    fetchAssignments(); // Refresh the list after an assignment is added or edited
    setIsAddAssignmentDialogOpen(false); // Close add dialog
    setIsEditAssignmentDialogOpen(false); // Close edit dialog
    setSelectedAssignment(null); // Clear selected assignment
  };

  const handleDeleteAssignment = async (productId: string, retailerId: string) => {
    if (!session?.user?.id) {
      console.error("User not authenticated.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this product assignment? This action cannot be undone.")) {
      const toastId = showLoading("Deleting assignment...");
      try {
        const { error } = await supabase
          .from('product_retailers')
          .delete()
          .eq('product_id', productId)
          .eq('retailer_id', retailerId)
          .eq('assigned_by_admin_id', session.user.id); // Ensure only admin can delete their own assignment

        if (error) {
          throw error;
        }

        showSuccess("Product assignment deleted successfully!");
        fetchAssignments(); // Refresh the list
      } catch (error: any) {
        console.error("Error deleting product assignment:", error);
        showError(`Failed to delete assignment: ${error.message || 'Unknown error'}`);
      } finally {
        dismissToast(toastId);
      }
    }
  };

  const handleEditClick = (assignment: ProductAssignment) => {
    setSelectedAssignment(assignment);
    setIsEditAssignmentDialogOpen(true);
  };

  if (isLoading || loadingAssignments || !session || profile?.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen text-lg">Loading Product Assignments...</div>;
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
              <Link to="/admin/retailers" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Retailers
              </Link>
            </li>
            <li>
              <Link to="/admin/product-assignments" className="block px-4 py-2 rounded-md bg-gray-700 transition-colors">
                Product Assignments
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Product Assignments</h1>
          <div className="flex justify-end mb-4">
            <Dialog open={isAddAssignmentDialogOpen} onOpenChange={setIsAddAssignmentDialogOpen}>
              <DialogTrigger asChild>
                <Button>Assign New Product</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Assign Product to Retailer</DialogTitle>
                </DialogHeader>
                <ProductAssignmentForm onAssignmentSaved={handleAssignmentSaved} onClose={() => setIsAddAssignmentDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {assignments.length === 0 ? (
            <p className="text-gray-600">No product assignments found. Assign your first product to a retailer!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Retailer Name</th>
                    <th className="py-2 px-4 border-b text-left">Product Name</th>
                    <th className="py-2 px-4 border-b text-left">Retailer Sale Price/Unit</th>
                    <th className="py-2 px-4 border-b text-left">Retailer Stock (Units)</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={`${assignment.product_id}-${assignment.retailer_id}`} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{assignment.retailers?.name || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{assignment.products?.name || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">${assignment.retailer_sale_price_per_unit.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">{assignment.retailer_current_stock_units}</td>
                      <td className="py-2 px-4 border-b">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(assignment)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignment(assignment.product_id, assignment.retailer_id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditAssignmentDialogOpen} onOpenChange={setIsEditAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product Assignment</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <ProductAssignmentForm
              initialAssignment={selectedAssignment}
              onAssignmentSaved={handleAssignmentSaved}
              onClose={() => setIsEditAssignmentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductAssignmentsPage;