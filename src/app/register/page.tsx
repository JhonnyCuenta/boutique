import { Suspense } from 'react';
import { RegisterForm } from '@/components/register-form';

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-card">Chargement...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
