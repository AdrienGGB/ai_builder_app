// Mark this component as a Client Component because it uses hooks and handles user interaction
"use client";

import { useState, FormEvent } from 'react';
// Assuming you'll add a component for authentication later
// import Auth from '../components/Auth';
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
  // You might need user state if authentication is implemented here
  // const [user, setUser] = useState<any>(null);

  const handlePromptSubmit = async (promptText: string) => {
    setLoading(true);
    setError(null);
    setAiResponse(null); // Clear previous response

    try {
      // TODO: Implement the call to your Supabase Edge Function here
      // Example using fetch:
      // const response = await fetch('/api/generate-website', { // Or directly to Edge Function URL
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     // Include Authorization header if your Edge Function requires authentication
      //     // 'Authorization': `Bearer ${await supabase.auth.getSession()}` // Example
      //   },
      //   body: JSON.stringify({ prompt: promptText }),
      // });

      // if (!response.ok) {
      //   throw new Error(`Error: ${response.statusText}`);
      // }

      // const data = await response.json();
      // setAiResponse(data as AiResponse);

      // --- Placeholder for demonstration ---
      // Simulate fetching data from the backend/AI
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      const simulatedResponse: AiResponse = {
        suggested_structure: "Homepage, About Us, Menu, Contact",
        welcome_message: "Welcome to our vegan restaurant!",
        sections: ["Hero Section", "About Us", "Menu Highlights", "Testimonials", "Contact Form", "Location Map"],
        raw_output: "This is a raw text output from the AI."
      };
      setAiResponse(simulatedResponse);
      // --- End Placeholder ---

    } catch (err: any) {
      console.error("Failed to fetch AI response:", err);
      setError(`Failed to generate website: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Conditional rendering based on authentication status */}
      {/* {!user ? (
        <Auth setUser={setUser} /> // Assuming Auth component handles sign up/in
      ) : ( */}
        <>
          <h1 className="text-2xl font-bold mb-4">Generate Your Website</h1>
          <PromptForm onSubmit={handlePromptSubmit} loading={loading} />

          {loading && <p>Generating...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {aiResponse && <WebsitePreview response={aiResponse} />}
        </>
      {/* )} */}
    </div>
  );
}
