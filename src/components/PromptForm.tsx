import { useState, FormEvent } from 'react';

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

export default function PromptForm({ onSubmit, loading }: PromptFormProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onSubmit(prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <textarea
        className="w-full p-2 border rounded mb-4 text-gray-700"
        rows={6}
        placeholder="Describe the website you want to generate (e.g., 'A website for a vegan restaurant in London with a menu and online booking form')."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
      />
      <button
        type="submit"
        className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Website'}
      </button>
    </form>
  );
}
