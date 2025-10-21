"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  size: string | null;
  pieces_per_unit: number;
  current_stock_units: number;
  wholesale_price_per_unit: number;
  sale_price_per_unit: number;
  admin_id: string;
  created_at: string;
}

const ProductsPage = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!session || profile?.role !== 'admin')) {
      navigate('/login');
    }
  }, [session, profile, isLoading, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (session && profile?.role === 'admin') {
        setLoadingProducts(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('admin_id', session.user.id); // Fetch only products owned by the current admin

        if (error) {
          console.error('Error fetching products:', error);
          setError('Failed to load products.');
          setProducts([]);
        } else {
          setProducts(data || []);
        }
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [session, profile]);

  const calculateProfitPerPiece = (product: Product) => {
    return product.sale_price_per_unit - product.wholesale_price_per_unit;
  };

  const calculateTotalProfit = (product: Product) => {
    return calculateProfitPerPiece(product) * product.current_stock_units * product.pieces_per_unit;
  };

  if (isLoading || loadingProducts || !session || profile?.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen text-lg">Loading Products...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 text-lg">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation (duplicate from AdminDashboard for now, will refactor later) */}
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
              <Link to="/admin/products" className="block px-4 py-2 rounded-md bg-gray-700 transition-colors">
                Products
              </Link>
            </li>
            {/* Add more admin links here */}
          </ul>
        </nav>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mt-auto"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Product Management</h1>
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Add New Product
            </button>
          </div>

          {products.length === 0 ? (
            <p className="text-gray-600">No products found. Add your first product!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Size</th>
                    <th className="py-2 px-4 border-b text-left">Pieces/Unit</th>
                    <th className="py-2 px-4 border-b text-left">Stock (Units)</th>
                    <th className="py-2 px-4 border-b text-left">Wholesale Price/Unit</th>
                    <th className="py-2 px-4 border-b text-left">Sale Price/Unit</th>
                    <th className="py-2 px-4 border-b text-left">Profit/Piece</th>
                    <th className="py-2 px-4 border-b text-left">Total Profit</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{product.name}</td>
                      <td className="py-2 px-4 border-b">{product.size || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{product.pieces_per_unit}</td>
                      <td className="py-2 px-4 border-b">{product.current_stock_units}</td>
                      <td className="py-2 px-4 border-b">${product.wholesale_price_per_unit.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">${product.sale_price_per_unit.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">${calculateProfitPerPiece(product).toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">${calculateTotalProfit(product).toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">
                        <button className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                        <button className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;