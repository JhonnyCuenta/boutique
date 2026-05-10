'use client';

import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Creation impossible');
      return;
    }

    const requestedNext = searchParams.get('next');
    router.push(requestedNext?.startsWith('/') ? requestedNext : '/account');
    router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <span className="form-chip">Client MW</span>
      <h1>Creer un compte</h1>
      <p>Votre compte permet de retrouver vos commandes, licences et informations de livraison.</p>
      <label>
        Nom / pseudo
        <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label>
        Mot de passe
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
      </label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="button primary full" type="submit" disabled={loading}>
        <UserPlus size={18} />
        {loading ? 'Creation...' : 'Creer mon compte'}
      </button>
      <p className="auth-switch">
        Deja inscrit ? <Link href="/login">Se connecter</Link>
      </p>
    </form>
  );
}
