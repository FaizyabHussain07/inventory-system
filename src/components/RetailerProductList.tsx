"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useSession } from './SessionContextProvider';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';

interface RetailerProduct {
  product_id: string;
  retailer_id: string;
  retailer_sale_price_per_unit: number;
  retailer_current_stock_units: number;
  retailer_last_updated_at: string;
  products: {
    name: string;
    size: string | null;
    pieces_per_unit: number;
  } | null;
}

const RetailerProductList = () => {
  const { session, profile, isLoading } = useSession();
  const [products, setProducts] = useState<RetailerProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<string | null>(null); // product_id being edited
  const [newStockValue, setNewStockValue] = useState<number>(0);

  const fetchRetailerProducts = async () => {
    if (session?.user?.id && profile?.role === 'retailer') {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('product_retailers')
        .select(`
          product_id,
          retailer_id,
          retailer_sale_price_per_unit,
          retailer_current_stock_units,
          retailer_last_updated_at,
          products (
            name,
            size,
            pieces_per_unit
          )
        `)
        .eq('retailer_id', session.user.id)
        .order('products.name', { ascending: true });

      if (error) {
        console.error('Error fetching retailer products:', error);
        setError('Failed to load your assigned products.');
        setProducts([]);
      } else {
        setProducts(data || []);
      }
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchRetailerProducts();
  }, [session, profile]);

  const handleEditStockClick = (productId: string, currentStock: number) => {
    setEditingStock(productId);
    setNewStockValue(currentStock);
  };

  const handleSaveStock = async (productId: string) => {
    if (!session?.user?.id || profile?.role !== 'retailer') {
      showError("You must be logged in as a retailer to update stock.");
      return;
    }

    if (newStockValue < 0) {
      showError("Stock units cannot be negative.");
      return;
    }

    const toastId = showLoading("Updating stock...");
    try {
      const { error } = await supabase
        .from('product_retailers')
        .update({
          retailer_current_stock_units: newStockValue,
          retailer_last_updated_at: new Date().toISOString(),
        })
        .eq('product_id', productId)
        .eq('retailer_id', session.user.id);

      if (error) {
        throw error;
      }

      showSuccess("Stock updated successfully!");
      setEditingStock(null); // Exit editing mode
      fetchRetailerProducts(); // Refresh the list
    } catch (error: any) {
      console.error("Error updating stock:", error);
      showError(`Failed to update stock: ${error.message || 'Unknown error'}`);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleCancelEdit = () => {
    setEditingStock(null);
    setNewStockValue(0);
  };

  if (isLoading || loadingProducts || !session || profile?.role !== 'retailer') {
    return <div className="flex justify-center items-center h-screen text-lg">Loading Products...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 text-lg">{error}</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Assigned Products</h2>

      {products.length === 0 ? (
        <p className="text-gray-600">No products have been assigned to you yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Product Name</th>
                <th className="py-2 px-4 border-b text-left">Size</th>
                <th className="py-2 px-4 border-b text-left">Pieces/Unit</th>
                <th className="py-2 px-4 border-b text-left">Your Sale Price/Unit</th>
                <th className="py-2 px-4 border-b text-left">Your Current Stock (Units)</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{product.products?.name || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{product.products?.size || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{product.products?.pieces_per_unit || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">${product.retailer_sale_price_per_unit.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">
                    {editingStock === product.product_id ? (
                      <Input
                        type="number"
                        value={newStockValue}
                        onChange={(e) => setNewStockValue(Number(e.target.value))}
                        className="w-24"
                      />
                    ) : (
                      product.retailer_current_stock_units
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {editingStock === product.product_id ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleSaveStock(product.product_id)} className="text-green-600 hover:text-green-800 mr-2">Save</Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-800">Cancel</Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStockClick(product.product_id, product.retailer_current_stock_units)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit Stock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RetailerProductList;