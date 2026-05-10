import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <main className="page-main">
      <section className="result-card">
        <XCircle size={42} />
        <h1>Paiement annule</h1>
        <p>Aucun paiement n a ete capture. Votre panier reste disponible dans votre navigateur.</p>
        <Link className="button primary" href="/#boutique">
          Reprendre la commande
        </Link>
      </section>
    </main>
  );
}
