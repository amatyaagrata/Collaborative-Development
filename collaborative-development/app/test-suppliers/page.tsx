'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestSuppliersPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const testLogin = async (email: string) => {
    setTesting(email);
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'Supplier2025!'
    });
    
    setResults(prev => ({
      ...prev,
      [email]: {
        success: !error,
        error: error?.message,
        user: data?.user?.email
      }
    }));
    setTesting(null);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Test Supplier Logins</h1>
        <p className="text-gray-600 mb-6">Password: <code className="bg-gray-200 px-2 py-1 rounded">Supplier2025!</code></p>
        
        <div className="space-y-3">
          {[
            'supplier@techdistro.com',
            'supplier@fashionhub.com', 
            'supplier@homeappliances.com',
            'supplier@toyworld.com',
            'supplier@beanmaster.com'
          ].map((email) => (
            <div key={email} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <span className="font-mono">{email}</span>
              <button
                onClick={() => testLogin(email)}
                disabled={testing !== null}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testing === email ? 'Testing...' : (results[email] ? 'Tested' : 'Test Login')}
              </button>
              {results[email] && (
                <span className={`ml-3 text-sm ${results[email].success ? 'text-green-600' : 'text-red-600'}`}>
                  {results[email].success ? '✅ Success!' : `❌ ${results[email].error}`}
                </span>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <p>Check browser console for more details.</p>
        </div>
      </div>
    </div>
  );
}