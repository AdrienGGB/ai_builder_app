import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { OpenAI } from 'https://deno.land/x/openai@v4.48.0/mod.ts';

// Utility to return JSON response with CORS
function createJsonResponse(body: any, status: number, additionalHeaders?: HeadersInit) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...additionalHeaders,
  });
  return new Response(JSON.stringify(body), { status, headers });
}

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL environment variable');
if (!supabaseAnonKey) throw new Error('Missing SUPABASE_ANON_KEY environment variable');
if (!openRouterApiKey) throw new Error('Missing OPENROUTER_API_KEY environment variable');

// Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { apiHost: supabaseUrl, persistSession: false },
});

// OpenRouter client
const openai = new OpenAI({
  apiKey: openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return createJsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return createJsonResponse({ error: 'Authentication required. No token provided.' }, 401);
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    console.error("Authentication failed:", authError?.message);
    return createJsonResponse({ error: `Authentication failed: ${authError?.message || 'Invalid token'}` }, 401);
  }

  let prompt: string;
  try {
    const body = await req.json();
    prompt = body.prompt;
    if (!prompt) {
      return createJsonResponse({ error: 'Missing prompt in request body' }, 400);
    }
  } catch (e) {
    console.error("Failed to parse request body:", e.message);
    return createJsonResponse({ error: 'Invalid JSON in request body' }, 400);
  }

  try {
    // Gemini-compatible request
    const aiCompletion = await openai.chat.completions.create({
      model: "google/gemini-2.5-pro-preview",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that helps generate website structures and content ideas based on user descriptions. Provide a response in JSON format, including fields like 'suggested_structure', 'welcome_message', and 'sections'."
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const aiResponseMessage = aiCompletion.choices[0]?.message?.content;
    if (!aiResponseMessage) {
      console.error("AI response is empty");
      return createJsonResponse({ error: 'AI did not return a message.' }, 500);
    }

    let aiResponseJson: any;
    try {
      aiResponseJson = JSON.parse(aiResponseMessage);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError.message);
      aiResponseJson = { error: "Failed to parse AI JSON response", raw_output: aiResponseMessage };
    }

    try {
      const { data: dbData, error: dbError } = await supabase
        .from('prompts')
        .insert([{ user_id: user.id, input_text: prompt, ai_response: aiResponseJson }])
        .select()
        .single();

      if (dbError) {
        console.error("Database insert error:", dbError.message);
        return createJsonResponse(aiResponseJson, 200);
      }

      return createJsonResponse({ ...aiResponseJson, prompt_id: dbData.id }, 200);
    } catch (dbException) {
      console.error("Unexpected DB error:", dbException.message);
      return createJsonResponse(aiResponseJson, 200);
    }

  } catch (error: any) {
    console.error("Function error:", error.message);
    const msg = error?.response?.data?.error?.message || error.message || 'Unknown error';
    return createJsonResponse({ error: msg }, 500);
  }
});
