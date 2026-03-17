import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('tonetunnel_token'));
  const [input, setInput] = useState('');

  // Validate token by hitting state
  const { isError, isLoading, isSuccess } = useQuery({
    queryKey: ['authState', token],
    queryFn: async () => {
      const res = await fetch('/api/state', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem('tonetunnel_token');
      setToken(null);
    }
  }, [isError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      localStorage.setItem('tonetunnel_token', input.trim());
      setToken(input.trim());
    }
  };

  if (!token || isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm rounded-xl p-8 bg-s1 shadow-2xl border border-border">
          <h1 className="text-2xl font-serif text-t1 font-semibold text-center mb-2">ToneTunnel</h1>
          <p className="text-t2 text-sm text-center mb-4">Enter your secret token to access the server.</p>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-s2 border border-border rounded-lg px-4 py-3 text-t1 focus:border-acc focus:outline-none transition-colors"
            placeholder="Secret Token"
          />
          <button type="submit" className="w-full bg-acc text-bg font-medium rounded-lg px-4 py-3 mt-2 hover:opacity-90 transition-opacity">
            Connect
          </button>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-bg text-t2">Connecting...</div>;
  }

  if (isSuccess) {
    return <>{children}</>;
  }

  return null;
}
