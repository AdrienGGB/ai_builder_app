// Mark this component as a Client Component if you need interactivity like click handlers that are not just for navigation
// For a simple link button, it can often be a Server Component, but using 'use client' is safer if you anticipate adding state or effects later.
"use client";

import Link from 'next/link';
import React from 'react';

interface SettingsButtonProps {
  // You can add props here later if you need to customize the button,
  // e.g., text, icon, additional styling.
  className?: string; // Allows adding custom CSS classes
}

export default function SettingsButton({ className }: SettingsButtonProps) {
  return (
    <Link href="/settings">
      <button
        className={`px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ${className}`}
      >
        Settings
      </button>
    </Link>
  );
}
