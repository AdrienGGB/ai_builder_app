// supabase/edge-functions/generate-website/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'; // Use the correct version
import { OpenAI } from 'https://deno.land/x/openai@v4.48.0/mod.ts'; // Use the correct version for OpenRouter compatibility

// Initialize Supabase client for the Edge Function environment
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    auth: {
      apiHost: Deno.env.get('SUPABASE_URL'), // Required for Auth in Edge Functions
      persistSession: false,
    },
  }
);

// Get the OpenRouter API key from Edge Function secrets
const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

if (!openRouterApiKey) {
  throw new Error('Missing OPENROUTER_API_KEY environment variable');
}

// Initialize OpenRouter client (OpenAI compatible API)
// Base URL is set to OpenRouter's API endpoint
const openai = new OpenAI({
    apiKey: openRouterApiKey,
    baseURL: "https://openrouter.ai/api/v1", // OpenRouter API endpoint
});


serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return new Response('Authentication required', { status: 401 });
  }

  // Authenticate the user using the token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error("Authentication failed:", authError?.message);
    return new Response('Authentication failed', { status: 401 });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response('Missing prompt in request body', { status: 400 });
    }

    // Call the AI model via OpenRouter
    // Choose a suitable model available on OpenRouter
    const aiCompletion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini", // Example model, choose one from OpenRouter
        messages: [
            { role: "system", content: "You are an AI assistant that helps generate website structures and content ideas based on user descriptions. Provide a response in JSON format, including fields like 'suggested_structure', 'welcome_message', and 'sections'." },
            { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" }, // Request JSON output if the model supports it
    });

    const aiResponse = aiCompletion.choices[0].message.content;
    let aiResponseJson: any = null;

    try {
      // Attempt to parse the AI response as JSON
      aiResponseJson = JSON.parse(aiResponse || '{}');
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // If parsing fails, store the raw response and indicate an error
      aiResponseJson = { error: "Failed to parse AI JSON response", raw_output: aiResponse };
    }


    // Store the prompt and AI response in the Supabase database
    const { data, error: dbError } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: user.id,
          input_text: prompt,
          ai_response: aiResponseJson, // Store the parsed (or raw) response
        },
      ])
      .select() // Select the inserted row to get the generated ID
      .single();

    if (dbError) {
      console.error("Failed to save prompt to DB:", dbError.message);
      // You might still want to return the AI response even if saving to DB fails
      return new Response(JSON.stringify(aiResponseJson), {
        headers: { 'Content-Type': 'application/json' },
        status: 500, // Indicate a server error occurred during saving
      });
    }

    // Return the AI response to the frontend
    return new Response(JSON.stringify(aiResponseJson), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Edge Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
