import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <main className="page-main">
      <section className="result-card success">
        <CheckCircle2 size={42} />
        <h1>Paiement valide</h1>
        <p>Votre achat est confirme. L email de livraison contient votre cle licence et votre lien de telechargement.</p>
        {searchParams.order ? <code>Commande {searchParams.order}</code> : null}
        <Link className="button primary" href="/">
          Retour boutique
        </Link>
      </section>
    </main>
  );
}
