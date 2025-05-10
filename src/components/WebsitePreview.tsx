import React from 'react';

interface SectionDetail {
  name: string;
  description?: string;
  content_ideas?: string[];
  // Allow other properties if the AI might add more
  [key: string]: any;
}

interface AiResponse {
  suggested_structure?: string | object; // Can be string or object
  welcome_message?: string;
  sections?: SectionDetail[]; // Array of section objects
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
          {typeof response.suggested_structure === 'string' ? (
            <p>{response.suggested_structure}</p>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(response.suggested_structure, null, 2)}
            </pre>
          )}
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
          <ul className="list-disc list-inside space-y-2">
            {response.sections.map((section, index) => (
              <li key={index} className="border-b pb-2 mb-2">
                {typeof section === 'object' && section.name ? (
                  <>
                    <strong>{section.name}</strong>
                    {section.description && (
                      <p className="text-sm text-gray-700 mt-1">{section.description}</p>
                    )}
                    {section.content_ideas && section.content_ideas.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-500">Content Ideas:</p>
                        <ul className="list-disc list-inside pl-4 text-xs text-gray-600">
                          {section.content_ideas.map((idea, ideaIndex) => (
                            <li key={ideaIndex}>{idea}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  // Fallback for unexpected section format
                  <>{JSON.stringify(section)}</>
                )}
              </li>
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
