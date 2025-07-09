"use client";

import React from 'react';

export default function ApiTestPage() {
  const [status, setStatus] = React.useState('Click Test to check Google Maps API');
  const [isLoading, setIsLoading] = React.useState(false);

  const testAPI = async () => {
    setIsLoading(true);
    setStatus('Testing Google Maps API...');

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setStatus('❌ ERROR: Google Maps API key not found');
        return;
      }

      // Test API key by loading a simple map
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      
      script.onload = () => {
        if (window.google && window.google.maps) {
          setStatus('✅ SUCCESS: Google Maps API is working! Billing and APIs are properly configured.');
        } else {
          setStatus('❌ ERROR: Google Maps loaded but not available');
        }
        setIsLoading(false);
      };
      
      script.onerror = () => {
        setStatus('❌ ERROR: Failed to load Google Maps API. Check billing and API activation.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
      
    } catch (error) {
      setStatus(`❌ ERROR: ${error}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Google Maps API Test</h1>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">API Key Status:</p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 
              `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20)}...` : 
              'No API key found'
            }
          </p>
        </div>

        <button
          onClick={testAPI}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded"
        >
          {isLoading ? 'Testing...' : 'Test Google Maps API'}
        </button>

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm">{status}</p>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p><strong>If you see errors:</strong></p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Go to Google Cloud Console</li>
            <li>Enable billing on your project</li>
            <li>Enable Maps JavaScript API</li>
            <li>Enable Directions API</li>
            <li>Wait 5-10 minutes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    google: any;
  }
} 