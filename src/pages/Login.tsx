"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../components/SessionContextProvider';

const Login = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading } = useSession();

  React.useEffect(() => {
    if (!isLoading && session && profile) {
      if (profile.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (profile.role === 'retailer') {
        navigate('/retailer-dashboard');
      } else {
        // If role is not set, default to admin for now or a setup page
        console.warn("User role not defined after login, defaulting to admin dashboard.");
        navigate('/admin-dashboard');
      }
    }
  }, [session, profile, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(222.2 47.4% 11.2%)', // Dark blue/black for brand
                  brandAccent: 'hsl(217.2 91.2% 59.8%)', // Lighter blue for accent
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin + '/'} // Redirect to root, which will then handle role-based redirect
        />
      </div>
    </div>
  );
};

export default Login;