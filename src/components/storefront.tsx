'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { categoryIcons, categoryLabels } from '@/config/store';
import { formatPrice } from '@/lib/format';

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onCancel?: () => void;
        onError?: (error: unknown) => void;
        style?: Record<string, unknown>;
      }) => { render: (element: HTMLElement) => void; close?: () => void };
    };
  }
}

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  badge: string | null;
  frameworks: string[];
  tags: string[];
  includes: string[];
  version: string;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type PayPalConfig = {
  clientId: string;
  currency: string;
};

const storageKey = 'mw-dev-cart-v1';

function readInitialCart() {
  if (typeof window === 'undefined') return [];
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as CartItem[];
  } catch {
    return [];
  }
}

export function Storefront({ products, initialCategory = 'ALL', compact = false }: { products: StoreProduct[]; initialCategory?: string; compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [cart, setCart] = useState<CartItem[]>(readInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notice, setNotice] = useState('');
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch('/api/paypal/config')
      .then((response) => response.json())
      .then((data: PayPalConfig) => setPaypalConfig(data))
      .catch(() => setPaypalConfig({ clientId: '', currency: 'EUR' }));
  }, []);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const categories = useMemo(() => ['ALL', ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const cartProducts = useMemo(
    () =>
      cart
        .map((item) => {
          const product = productMap.get(item.productId);
          return product ? { ...product, quantity: item.quantity } : null;
        })
        .filter((item): item is StoreProduct & { quantity: number } => Boolean(item)),
    [cart, productMap],
  );
  const total = cartProducts.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchCategory = category === 'ALL' || product.category === category;
      const matchQuery =
        !normalized ||
        [product.name, product.shortDescription, product.description, ...product.frameworks, ...product.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      return matchCategory && matchQuery;
    });
  }, [products, query, category]);

  function addToCart(productId: string) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) => (item.productId === productId ? { ...item, quantity: Math.min(item.quantity + 1, 5) } : item));
      }
      return [...current, { productId, quantity: 1 }];
    });
    setNotice('Produit ajoute au panier');
    setCartOpen(true);
    window.setTimeout(() => setNotice(''), 1800);
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }

  useEffect(() => {
    if (!checkoutOpen || !paypalLoaded || !paypalRef.current || !window.paypal || cartProducts.length === 0) return;
    paypalRef.current.innerHTML = '';

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
      },
      createOrder: async () => {
        if (!customerEmail || !customerName) {
          throw new Error('Nom et email requis');
        }

        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail,
            customerName,
            items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          }),
        });
        const data = (await response.json()) as { paypalOrderId?: string; error?: string };
        if (!response.ok || !data.paypalOrderId) {
          throw new Error(data.error || 'Commande PayPal impossible');
        }
        return data.paypalOrderId;
      },
      onApprove: async (data) => {
        const response = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paypalOrderId: data.orderID }),
        });
        const payload = (await response.json()) as { orderId?: string; error?: string };
        if (!response.ok || !payload.orderId) {
          throw new Error(payload.error || 'Capture PayPal impossible');
        }
        setCart([]);
        window.localStorage.removeItem(storageKey);
        router.push(`/checkout/success?order=${payload.orderId}`);
      },
      onCancel: () => {
        router.push('/checkout/cancel');
      },
      onError: (error) => {
        console.error(error);
        setNotice('Paiement impossible, verifiez PayPal ou contactez le support.');
      },
    });

    buttons.render(paypalRef.current);
    return () => {
      buttons.close?.();
    };
  }, [cart, cartProducts.length, checkoutOpen, customerEmail, customerName, paypalLoaded, router]);

  return (
    <section className={compact ? 'catalog compact' : 'catalog'} id="boutique">
      {paypalConfig?.clientId ? (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalConfig.clientId)}&currency=${paypalConfig.currency || 'EUR'}&intent=capture`}
          onLoad={() => setPaypalLoaded(true)}
        />
      ) : null}

      <div className="catalog-toolbar">
        <div>
          <span className="section-kicker">
            <Sparkles size={15} />
            Boutique FiveM premium
          </span>
          <h2>Scripts prets pour serveurs RP ambitieux</h2>
        </div>
        <div className="toolbar-actions">
          <label className="search-box">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un script..." />
          </label>
          <button className="button ghost" type="button" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={18} />
            Panier ({cartProducts.length})
          </button>
        </div>
      </div>

      <div className="category-row" aria-label="Filtres categories">
        <span className="filter-label">
          <SlidersHorizontal size={15} />
          Filtres
        </span>
        {categories.map((item) => {
          const Icon = categoryIcons[item] || Sparkles;
          return (
            <button key={item} className={category === item ? 'category-pill active' : 'category-pill'} type="button" onClick={() => setCategory(item)}>
              <Icon size={15} />
              {categoryLabels[item] || item}
            </button>
          );
        })}
      </div>

      <div className="product-grid">
        {filtered.map((product, index) => (
          <motion.article
            className="product-card"
            key={product.id}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.45 }}
          >
            <div className="product-media">
              <img src={product.imageUrl} alt="" />
              {product.badge ? <span className="product-badge">{product.badge.replace('_', ' ')}</span> : null}
            </div>
            <div className="product-content">
              <div className="product-title-row">
                <h3>{product.name}</h3>
                <span>{formatPrice(product.priceCents, product.currency)}</span>
              </div>
              <p>{product.shortDescription}</p>
              <div className="tag-row">
                {product.frameworks.slice(0, 3).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <button className="button primary full" type="button" onClick={() => addToCart(product.id)}>
                Acheter
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {cartOpen ? (
          <motion.aside className="cart-drawer" initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}>
            <button className="drawer-close" type="button" onClick={() => setCartOpen(false)} aria-label="Fermer">
              <X size={20} />
            </button>
            <h3>Panier MW</h3>
            {cartProducts.length === 0 ? (
              <p className="muted">Votre panier est vide.</p>
            ) : (
              <div className="cart-lines">
                {cartProducts.map((item) => (
                  <div className="cart-line" key={item.id}>
                    <img src={item.imageUrl} alt="" />
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.quantity} x {formatPrice(item.priceCents, item.currency)}
                      </span>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)}>
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="cart-total">
              <span>Total</span>
              <strong>{formatPrice(total, cartProducts[0]?.currency || 'EUR')}</strong>
            </div>
            <button className="button primary full" type="button" disabled={cartProducts.length === 0} onClick={() => setCheckoutOpen(true)}>
              Payer avec PayPal
            </button>
            {!paypalConfig?.clientId ? <p className="form-error">PAYPAL_CLIENT_ID manquant dans l&apos;environnement.</p> : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {checkoutOpen ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="checkout-modal" initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}>
              <button className="drawer-close" type="button" onClick={() => setCheckoutOpen(false)} aria-label="Fermer">
                <X size={20} />
              </button>
              <h3>Finaliser votre achat</h3>
              <p>Apres paiement valide, vous recevez automatiquement un email avec la cle licence et le lien de telechargement.</p>
              <div className="checkout-fields">
                <label>
                  Nom / pseudo
                  <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Votre nom" />
                </label>
                <label>
                  Email de livraison
                  <input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="client@email.fr" type="email" />
                </label>
              </div>
              <div className="checkout-summary">
                <span>{cartProducts.length} produit(s)</span>
                <strong>{formatPrice(total, cartProducts[0]?.currency || 'EUR')}</strong>
              </div>
              <div className="paypal-box" ref={paypalRef}>
                {!paypalLoaded ? 'Chargement PayPal...' : null}
              </div>
              {notice ? <div className="toast inline">{notice}</div> : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {notice && !checkoutOpen ? <div className="toast">{notice}</div> : null}
    </section>
  );
}
