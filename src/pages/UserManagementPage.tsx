"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'retailer' | null;
  email: string; // Assuming email can be fetched or is part of the profile
}

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && (!session || profile?.role !== 'admin')) {
      navigate('/login');
    }
  }, [session, profile, isLoading, navigate]);

  const fetchUsers = async () => {
    if (session && profile?.role === 'admin') {
      setLoadingUsers(true);
      // Fetch profiles and join with auth.users to get email
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role,
          auth_users:auth.users(email)
        `)
        .neq('id', session.user.id) // Exclude the current admin
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users.');
        setUsers([]);
      } else {
        const formattedUsers: UserProfile[] = data.map((user: any) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url, // Not fetching avatar_url in this query, but keeping type
          role: user.role,
          email: user.auth_users?.email || 'N/A',
        }));
        setUsers(formattedUsers);
      }
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session, profile]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'retailer') => {
    if (!session?.user?.id || profile?.role !== 'admin') {
      showError("You are not authorized to change user roles.");
      return;
    }

    const toastId = showLoading("Updating user role...");
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      showSuccess("User role updated successfully!");
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error("Error updating user role:", error);
      showError(`Failed to update role: ${error.message || 'Unknown error'}`);
    } finally {
      dismissToast(toastId);
    }
  };

  if (isLoading || loadingUsers || !session || profile?.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen text-lg">Loading User Management...</div>;
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
              <Link to="/admin/product-assignments" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Product Assignments
              </Link>
            </li>
            <li>
              <Link to="/admin/user-management" className="block px-4 py-2 rounded-md bg-gray-700 transition-colors">
                User Management
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>

          {users.length === 0 ? (
            <p className="text-gray-600">No other users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Email</th>
                    <th className="py-2 px-4 border-b text-left">Role</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{user.first_name} {user.last_name}</td>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                      <td className="py-2 px-4 border-b">
                        <Select
                          value={user.role || 'retailer'}
                          onValueChange={(value: 'admin' | 'retailer') => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="retailer">Retailer</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {/* Future actions like delete user could go here */}
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

export default UserManagementPage;