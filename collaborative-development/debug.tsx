'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
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
      [name]: error ? `❌ ${error.message}` : `✅ Success! (${data.user?.id.slice(0, 8)}...)`
    }));
    setLoading(null);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Supplier Logins</h1>
      <p className="text-gray-600 mb-6">Password for all: <code className="bg-gray-100 px-2 py-1 rounded">Supplier2025!</code></p>
      
      <div className="grid gap-3">
        {[
          ['supplier@techdistro.com', 'TechDistro'],
          ['supplier@fashionhub.com', 'FashionHub'],
          ['supplier@homeappliances.com', 'HomeAppliances'],
          ['supplier@toyworld.com', 'ToyWorld'],
          ['supplier@beanmaster.com', 'BeanMaster'],
        ].map(([email, name]) => (
          <button
            key={name}
            onClick={() => testLogin(email, name)}
            disabled={loading !== null}
            className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <span>
              <span className="font-medium">{name}</span>
              <span className="text-gray-500 ml-2 text-sm">{email}</span>
            </span>
            <span>
              {loading === name ? (
                <span className="text-blue-500">Testing...</span>
              ) : results[name] ? (
                <span className={results[name].includes('✅') ? 'text-green-600' : 'text-red-600'}>
                  {results[name]}
                </span>
              ) : (
                <span className="text-gray-400">Test →</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}