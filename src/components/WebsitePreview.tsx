import React from 'react';

interface AiResponse {
  suggested_structure?: string;
  welcome_message?: string;
  sections?: string[];
  [key: string]: any; // Allow for other properties, including raw output
}

interface WebsitePreviewProps {
  response: AiResponse;
}

export default function WebsitePreview({ response }: WebsitePreviewProps) {
  // Basic check to see if the response is empty
  const isEmpty = Object.keys(response).length === 0;

  if (isEmpty) {
    return <p>No website preview available.</p>;
  }

  return (
    <div className="border p-4 rounded bg-gray-50">
      <h2 className="text-xl font-semibold mb-4">Generated Website Preview</h2>

      {/* Display structured parts of the response */}
      {response.suggested_structure && (
        <div className="mb-4">
          <h3 className="text-lg font-medium">Suggested Structure:</h3>
          <p>{response.suggested_structure}</p>
        </div>
      )}

      {response.welcome_message && (
        <div className="mb-4">
          <h3 className="text-lg font-medium">Welcome Message:</h3>
          <p>{response.welcome_message}</p>
        </div>
      )}

      {response.sections && response.sections.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium">Suggested Sections:</h3>
          <ul className="list-disc list-inside">
            {response.sections.map((section, index) => (
              <li key={index}>{section}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Display the raw JSON for debugging or completeness */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium">Raw AI Response (JSON):</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>

    </div>
  );
}
