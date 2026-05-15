'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PublicDebugPage() {
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testLogin = async (email: string, name: string) => {
    setLoading(name);
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'Supplier2025!'
    });
    
    setResults(prev => ({
      ...prev,
      [name]: error ? `❌ ${error.message}` : `✅ Success! (${data.user?.email})`
    }));
    setLoading(null);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Test Supplier Logins</h1>
        <p className="text-gray-600 mb-6">Password for all: <code className="bg-gray-200 px-2 py-1 rounded">Supplier2025!</code></p>
        
        <div className="space-y-3">
          {[
            ['supplier@techdistro.com', 'TechDistro'],
            ['supplier@fashionhub.com', 'FashionHub'],
            ['supplier@homeappliances.com', 'HomeAppliances'],
            ['supplier@toyworld.com', 'ToyWorld'],
            ['supplier@beanmaster.com', 'BeanMaster'],
          ].map(([email, name]) => (
            <div key={name} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <span className="font-medium">{name}</span>
                <span className="text-gray-500 ml-2 text-sm">{email}</span>
              </div>
              <button
                onClick={() => testLogin(email, name)}
                disabled={loading !== null}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === name ? 'Testing...' : (results[name] || 'Test Login')}
              </button>
              {results[name] && (
                <span className={`ml-3 text-sm ${results[name].includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {results[name]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}