"use client";

import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional().or(z.literal('')),
  last_name: z.string().min(1, "Last name is required").optional().or(z.literal('')),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      avatar_url: '',
    },
  });

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login');
    }
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [session, profile, isLoading, navigate, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!session?.user?.id) {
      showError("You must be logged in to update your profile.");
      return;
    }

    const toastId = showLoading("Updating profile...");

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: values.first_name || null,
          last_name: values.last_name || null,
          avatar_url: values.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) {
        throw error;
      }

      showSuccess("Profile updated successfully!");
      // The SessionContextProvider will automatically refetch the profile on auth state change
      // or when the session updates, so no manual refetch needed here.
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showError(`Failed to update profile: ${error.message || 'Unknown error'}`);
    } finally {
      dismissToast(toastId);
    }
  };

  if (isLoading || !session) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading Profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation (Conditional based on role) */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-6">
        <h2 className="text-2xl font-bold mb-6">
          {profile?.role === 'admin' ? 'Admin Panel' : 'Retailer Panel'}
        </h2>
        <nav>
          <ul className="space-y-2">
            {profile?.role === 'admin' ? (
              <>
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
              </>
            ) : (
              <li>
                <Link to="/retailer-dashboard" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Dashboard
                </Link>
              </li>
            )}
            <li>
              <Link to="/profile" className="block px-4 py-2 rounded-md bg-gray-700 transition-colors">
                Profile
              </Link>
            </li>
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
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Profile</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={session.user?.email || ''} disabled className="bg-gray-100" />
            </div>
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="avatar_url">Avatar URL (Optional)</Label>
              <Input id="avatar_url" type="url" {...register("avatar_url")} />
              {errors.avatar_url && <p className="text-red-500 text-sm mt-1">{errors.avatar_url.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;