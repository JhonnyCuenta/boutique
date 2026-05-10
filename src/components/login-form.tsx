'use client';

import { LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Connexion impossible');
      return;
    }

    router.push(searchParams.get('next') || '/admin');
    router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <span className="form-chip">Owner access</span>
      <h1>Connexion MW</h1>
      <p>Acces reserve aux 2 owners autorises pour gerer scripts, prix, commandes et licences.</p>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label>
        Mot de passe
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="button primary full" type="submit" disabled={loading}>
        <LogIn size={18} />
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}
