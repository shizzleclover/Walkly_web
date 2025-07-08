"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, testSupabaseConnection } from '@/lib/supabase';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

export default function DebugSupabasePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Environment Variables
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      testResults.push({
        test: 'Environment Variables',
        success: !!(url && key),
        message: url && key ? 'Environment variables loaded' : 'Missing environment variables',
        details: {
          hasUrl: !!url,
          hasKey: !!key,
          urlLength: url?.length || 0,
          keyLength: key?.length || 0,
          keyPrefix: key?.substring(0, 20) + '...' || 'None'
        }
      });
    } catch (error) {
      testResults.push({
        test: 'Environment Variables',
        success: false,
        message: 'Error checking environment variables',
        details: error
      });
    }

    // Test 2: Supabase Client Initialization
    try {
      const client = supabase;
      testResults.push({
        test: 'Client Initialization',
        success: !!client,
        message: client ? 'Supabase client initialized' : 'Failed to initialize client',
        details: {
          clientExists: !!client,
          supabaseUrl: client?.supabaseUrl || 'Not available',
          supabaseKey: client?.supabaseKey?.substring(0, 20) + '...' || 'Not available'
        }
      });
    } catch (error) {
      testResults.push({
        test: 'Client Initialization',
        success: false,
        message: 'Error initializing client',
        details: error
      });
    }

    // Test 3: Connection Test
    try {
      const connectionResult = await testSupabaseConnection();
      testResults.push({
        test: 'Connection Test',
        success: connectionResult.success,
        message: connectionResult.success ? 'Connection successful' : `Connection failed: ${connectionResult.error}`,
        details: connectionResult
      });
    } catch (error) {
      testResults.push({
        test: 'Connection Test',
        success: false,
        message: 'Connection test threw an exception',
        details: error
      });
    }

    // Test 4: Simple Auth Call
    try {
      const { data, error } = await supabase.auth.getSession();
      testResults.push({
        test: 'Auth Session Call',
        success: !error,
        message: error ? `Auth call failed: ${error.message}` : 'Auth call successful',
        details: { data, error }
      });
    } catch (error) {
      testResults.push({
        test: 'Auth Session Call',
        success: false,
        message: 'Auth call threw an exception',
        details: error
      });
    }

    // Test 5: Test Login with Invalid Credentials
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'invalid'
      });
      
      // This should fail, but we want to see HOW it fails
      testResults.push({
        test: 'Test Login (Invalid Credentials)',
        success: error?.message?.includes('Invalid login credentials') || false,
        message: error ? `Expected auth error: ${error.message}` : 'Unexpected success with invalid credentials',
        details: { 
          error: error ? {
            message: error.message,
            status: (error as any).status,
            name: error.name
          } : null,
          data
        }
      });
    } catch (error) {
      testResults.push({
        test: 'Test Login (Invalid Credentials)',
        success: false,
        message: 'Login test threw an exception',
        details: error
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Supabase Connection Debug</h1>
          <p className="text-muted-foreground mt-2">
            Testing Supabase connection and authentication
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connection Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTests} 
              disabled={testing}
              className="mb-4"
            >
              {testing ? 'Running Tests...' : 'Run Tests'}
            </Button>

            {results.length > 0 && (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index} className={result.success ? 'border-green-500' : 'border-red-500'}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`h-3 w-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <h3 className="font-semibold">{result.test}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium">Details</summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            This page will help identify Supabase connection issues. 
            After debugging, this page should be removed.
          </p>
        </div>
      </div>
    </div>
  );
} 