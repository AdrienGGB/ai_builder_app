// Mark this component as a Client Component
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabase'; // Import your Supabase client 
import { User } from '@supabase/supabase-js';
import Link from 'next/link'; // Import Link for navigation

interface ProjectSettings {
  id?: string; // Optional because it's generated on insert
  user_id?: string; // Optional because we get it from auth
  github_repo: string;
  vercel_project_url: string;
  openrouter_api_key: string;
  supabase_url: string;
  supabase_key: string;
  created_at?: string; // Optional
}

export default function ProjectSettingsPage() {
  const [settings, setSettings] = useState<ProjectSettings>({
    github_repo: '',
    vercel_project_url: '',
    openrouter_api_key: '',
    supabase_url: '',
    supabase_key: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [settingsExist, setSettingsExist] = useState(false); // To check if we need to insert or update

  useEffect(() => {
    async function fetchUserAndSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('project_settings')
          .select('id, github_repo, vercel_project_url, openrouter_api_key, supabase_url, supabase_key')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error("Error fetching settings:", error);
          setError('Failed to fetch settings.');
        } else if (data) {
          setSettings(data);
          setSettingsExist(true);
        }
      }
      setLoading(false);
    }

    fetchUserAndSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to save settings.');
      setSaving(false);
      return;
    }

    const settingsData = {
      user_id: user.id,
      github_repo: settings.github_repo,
      vercel_project_url: settings.vercel_project_url,
      openrouter_api_key: settings.openrouter_api_key,
      supabase_url: settings.supabase_url,
      supabase_key: settings.supabase_key,
    };

    let dbError = null;

    if (settingsExist && settings.id) {
      // Update existing settings
      const { error } = await supabase
        .from('project_settings')
        .update(settingsData)
        .eq('id', settings.id);
      dbError = error;
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('project_settings')
        .insert([settingsData]);
      dbError = error;
    }

    if (dbError) {
      console.error("Error saving settings:", dbError);
      setError(`Failed to save settings: ${dbError.message}`);
    } else {
      setSuccess('Settings saved successfully!');
      // After saving, refetch to ensure settingsExist and ID are updated if it was an insert
      const { data, error: fetchError } = await supabase
        .from('project_settings')
        .select('id, github_repo, vercel_project_url, openrouter_api_key, supabase_url, supabase_key')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
           console.error("Error refetching settings after save:", fetchError);
           setError('Settings saved, but failed to refetch.');
      } else if (data) {
           setSettings(data);
           setSettingsExist(true);
      }
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading settings...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Please log in to manage project settings.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href="/">
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50">
            &larr; Back to Home
          </button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Project Settings</h1>

      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="github_repo" className="block text-sm font-medium text-gray-700">GitHub Repository URL:</label>
          <input
            type="text"
            id="github_repo"
            name="github_repo"
            value={settings.github_repo}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="vercel_project_url" className="block text-sm font-medium text-gray-700">Vercel Project URL:</label>
          <input
            type="text"
            id="vercel_project_url"
            name="vercel_project_url"
            value={settings.vercel_project_url}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="openrouter_api_key" className="block text-sm font-medium text-gray-700">OpenRouter API Key:</label>
          <input
            type="text"
            id="openrouter_api_key"
            name="openrouter_api_key"
            value={settings.openrouter_api_key}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="supabase_url" className="block text-sm font-medium text-gray-700">Supabase URL:</label>
          <input
            type="text"
            id="supabase_url"
            name="supabase_url"
            value={settings.supabase_url}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="supabase_key" className="block text-sm font-medium text-gray-700">Supabase Key (Anon public):</label>
          <input
            type="text"
            id="supabase_key"
            name="supabase_key"
            value={settings.supabase_key}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <button
            type="submit"
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={saving}
          >
            {saving ? 'Saving...' : settingsExist ? 'Update Settings' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
