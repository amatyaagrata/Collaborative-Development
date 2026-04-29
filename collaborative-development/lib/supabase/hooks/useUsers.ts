import { useState, useEffect } from "react";
import { getUsers } from "@/lib/supabase/actions/userActions";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'driver' | 'customer';
  phone?: string;
  created_at: string;
  updated_at: string;
}

export function useUsers() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const users = await getUsers();
        setData(users as User[] || []);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const users = await getUsers();
      setData(users as User[] || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
