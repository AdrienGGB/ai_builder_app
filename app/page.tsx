// Mark this component as a Client Component because it uses hooks and handles user interaction
"use client";

// Mark this component as a Client Component because it uses hooks and handles user interaction
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabase'; // Import your Supabase client
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import Auth from '@/components/Auth'; // Import the Auth component
import PromptForm from '@/components/PromptForm';
import WebsitePreview from '@/components/WebsitePreview';

interface AiResponse {
  // Define the structure of your expected AI response
  // This is just a placeholder, adjust based on actual AI output
  suggested_structure?: string;
  welcome_message?: string;
  sections?: string[];
  [key: string]: any; // Allow for other properties
}

export default function HomePage() {
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // State to hold the authenticated user
  const [isAuthenticating, setIsAuthenticating] = useState(true); // State to track initial authentication check
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAuthenticating(false);
    }

    getUser();

    // Subscribe to auth state changes (optional, but good for real-time updates)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticating(false);
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Run only on mount and unmount

  const handlePromptSubmit = async (promptText: string) => {
    setLoading(true);
    setError(null);
    setAiResponse(null); // Clear previous response

    if (!user) {
      setError('You must be logged in to generate a website.');
      setLoading(false);
      return;
    }

    try {
      // TODO: Replace with the actual URL of your deployed Supabase Edge Function
      // This URL is typically like https://<project-ref>.supabase.co/functions/v1/generate-website
      const edgeFunctionUrl = 'YOUR_SUPABASE_EDGE_FUNCTION_URL'; // *** IMPORTANT: Replace with your actual URL ***

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
         setError('No active Supabase session found.');
         setLoading(false);
         return;
      }

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // Include the auth token
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) {
        const errorBody = await response.text(); // Read error response body
        throw new Error(`Error: ${response.status} - ${errorBody}`);
      }

      const data: AiResponse = await response.json();
      setAiResponse(data);

    } catch (err: any) {
      console.error("Failed to fetch AI response:", err);
      setError(`Failed to generate website: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Show a loading indicator while checking authentication status
  if (isAuthenticating) {
    return <div className="container mx-auto p-4">Loading authentication...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Conditional rendering based on authentication status */}
      {!user ? (
        <Auth /> // Render Auth component if no user is logged in
      ) : (
        <>
           {/* Display user's email or other info if needed */}
          <p className="text-sm text-gray-600 mb-4">Logged in as: {user.email}</p>

          <h1 className="text-2xl font-bold mb-4">Generate Your Website</h1>
          <PromptForm onSubmit={handlePromptSubmit} loading={loading} />

          {loading && <p>Generating...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {aiResponse && <WebsitePreview response={aiResponse} />}

          {/* Optional: Add a Sign Out button */}
           <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} // Redirect to login after sign out
            className="mt-4 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}
