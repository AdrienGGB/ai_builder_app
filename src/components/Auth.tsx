// Mark this component as a Client Component
"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // 1. Check if the user has the "admin" role
    const { data: userRoleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .maybeSingle(); // Use maybeSingle instead of single

    // Handle the case where the user might not be in the 'users' table
    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error checking user role:", roleError);
      setError('Error checking user role: ' + roleError.message);
      setLoading(false);
      return;
    }

    const isAdmin = roleError?.code !== 'PGRST116' && userRoleData?.role === 'admin';

    let data, authError;

    if (isSignUp) {
      // 2. Handle sign-up
      ({ data, error: authError } = await supabase.auth.signUp({ email, password }));
    } else if (isAdmin) {
      // 3. Bypass password for admins via magic link
      ({ data, error: authError } = await supabase.auth.signInWithOtp({ email }));
      setMessage('Magic link sent to admin email. Please check your inbox.');
    } else {
      // 4. Normal password sign-in
      ({ data, error: authError } = await supabase.auth.signInWithPassword({ email, password }));
    }

    if (authError) {
      setError(authError.message);
    } else if (data?.user || isAdmin) {
      setMessage(isSignUp
        ? 'Sign up successful. Please check your email to confirm.'
        : isAdmin
          ? 'Magic link sent to your admin email.'
          : 'Sign in successful.');
      if (!isSignUp && !isAdmin) {
        router.push('/');
      }
    } else {
      setMessage('Please check your email for a confirmation link.');
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {isSignUp ? 'Create an account' : 'Sign in to your account'}
        </h2>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          {!isSignUp && (
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-center text-sm">
          <button
            className="font-medium text-blue-600 hover:text-blue-500"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
