'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Upload, Save, Trash2 } from 'lucide-react';
import { categoryLabels } from '@/config/store';
import { formatPrice, safeSlug } from '@/lib/format';

type AdminAsset = {
  id: string;
  fileName: string;
  version: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminProduct = {
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
  status: string;
  frameworks: string[];
  tags: string[];
  includes: string[];
  version: string;
  assets: AdminAsset[];
};

const categories = ['ESX', 'QBCORE', 'UI_HUD', 'MAPPING_MLO', 'ZOMBIES', 'ANTICHEAT', 'JOBS', 'EMS', 'POLICE'];
const badges = ['', 'NEW', 'BEST_SELLER', 'PREMIUM'];
const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

const emptyProduct: AdminProduct = {
  id: '',
  slug: '',
  name: '',
  category: 'ESX',
  shortDescription: '',
  description: '',
  priceCents: 1999,
  currency: 'EUR',
  imageUrl: '/images/inventory-preview.png',
  badge: 'NEW',
  status: 'PUBLISHED',
  frameworks: ['ESX'],
  tags: [],
  includes: ['fxmanifest.lua', 'config.lua', 'client.lua', 'server.lua'],
  version: '1.0.0',
  assets: [],
};

export function AdminProductsClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id || '');
  const [draft, setDraft] = useState<AdminProduct>(initialProducts[0] || emptyProduct);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const selected = useMemo(() => products.find((product) => product.id === selectedId), [products, selectedId]);

  function selectProduct(product: AdminProduct) {
    setSelectedId(product.id);
    setDraft(product);
    setMessage('');
  }

  function newProduct() {
    setSelectedId('');
    setDraft({ ...emptyProduct, slug: '', id: '', name: '' });
    setMessage('');
  }

  function updateArray(field: 'frameworks' | 'tags' | 'includes', value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const payload = {
      ...draft,
      slug: draft.slug || safeSlug(draft.name),
      badge: draft.badge || null,
    };
    const response = await fetch(draft.id ? `/api/admin/products/${draft.id}` : '/api/admin/products', {
      method: draft.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { product?: AdminProduct; error?: string };
    if (!response.ok || !data.product) {
      setMessage(data.error || 'Sauvegarde impossible');
      return;
    }

    setProducts((current) => {
      const exists = current.some((product) => product.id === data.product!.id);
      return exists ? current.map((product) => (product.id === data.product!.id ? { ...data.product!, assets: product.assets } : product)) : [data.product!, ...current];
    });
    setSelectedId(data.product.id);
    setDraft({ ...data.product, assets: draft.assets });
    setMessage('Produit sauvegarde');
  }

  async function archiveProduct() {
    if (!draft.id) return;
    const response = await fetch(`/api/admin/products/${draft.id}`, { method: 'DELETE' });
    if (response.ok) {
      setProducts((current) => current.map((product) => (product.id === draft.id ? { ...product, status: 'ARCHIVED' } : product)));
      setDraft((current) => ({ ...current, status: 'ARCHIVED' }));
      setMessage('Produit archive');
    }
  }

  async function uploadAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.id) {
      setMessage('Sauvegardez le produit avant upload');
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('productId', draft.id);
    setUploading(true);
    const response = await fetch('/api/admin/assets', { method: 'POST', body: formData });
    const data = (await response.json()) as { asset?: AdminAsset; error?: string };
    setUploading(false);
    if (!response.ok || !data.asset) {
      setMessage(data.error || 'Upload impossible');
      return;
    }
    const nextAssets = [data.asset, ...draft.assets.map((asset) => ({ ...asset, isActive: false }))];
    setDraft((current) => ({ ...current, assets: nextAssets }));
    setProducts((current) => current.map((product) => (product.id === draft.id ? { ...product, assets: nextAssets } : product)));
    form.reset();
    setMessage('Fichier ZIP prive ajoute');
  }

  return (
    <div className="admin-products">
      <aside className="admin-list">
        <button className="button primary full" type="button" onClick={newProduct}>
          Nouveau produit
        </button>
        {products.map((product) => (
          <button className={selected?.id === product.id ? 'admin-list-item active' : 'admin-list-item'} key={product.id} type="button" onClick={() => selectProduct(product)}>
            <strong>{product.name}</strong>
            <span>
              {categoryLabels[product.category] || product.category} - {formatPrice(product.priceCents, product.currency)}
            </span>
          </button>
        ))}
      </aside>

      <section className="admin-editor">
        <form className="admin-form" onSubmit={saveProduct}>
          <div className="form-grid two">
            <label>
              Nom
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
            </label>
            <label>
              Slug
              <input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="auto si vide" />
            </label>
            <label>
              Categorie
              <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category] || category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prix en centimes
              <input type="number" min={100} value={draft.priceCents} onChange={(event) => setDraft({ ...draft, priceCents: Number(event.target.value) })} />
            </label>
            <label>
              Badge
              <select value={draft.badge || ''} onChange={(event) => setDraft({ ...draft, badge: event.target.value || null })}>
                {badges.map((badge) => (
                  <option key={badge || 'none'} value={badge}>
                    {badge || 'Aucun'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Statut
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Image URL
            <input value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} />
          </label>
          <label>
            Description courte
            <input value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} required />
          </label>
          <label>
            Description
            <textarea rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required />
          </label>
          <div className="form-grid three">
            <label>
              Frameworks
              <input value={draft.frameworks.join(', ')} onChange={(event) => updateArray('frameworks', event.target.value)} />
            </label>
            <label>
              Tags
              <input value={draft.tags.join(', ')} onChange={(event) => updateArray('tags', event.target.value)} />
            </label>
            <label>
              Inclus
              <input value={draft.includes.join(', ')} onChange={(event) => updateArray('includes', event.target.value)} />
            </label>
          </div>
          <div className="form-actions">
            <button className="button primary" type="submit">
              <Save size={17} />
              Sauvegarder
            </button>
            {draft.id ? (
              <button className="button danger" type="button" onClick={archiveProduct}>
                <Trash2 size={17} />
                Archiver
              </button>
            ) : null}
          </div>
        </form>

        <form className="asset-form" onSubmit={uploadAsset}>
          <h3>Fichier ZIP prive</h3>
          <p>Le dernier ZIP actif sera livre aux clients via lien temporaire apres paiement.</p>
          <div className="form-grid three">
            <label>
              Version
              <input name="version" defaultValue={draft.version} />
            </label>
            <label className="file-label">
              ZIP
              <input name="file" type="file" accept=".zip" />
            </label>
            <button className="button ghost" type="submit" disabled={uploading || !draft.id}>
              <Upload size={17} />
              {uploading ? 'Upload...' : 'Uploader'}
            </button>
          </div>
          <div className="asset-list">
            {draft.assets.length === 0 ? <span>Aucun fichier ajoute.</span> : null}
            {draft.assets.map((asset) => (
              <span key={asset.id} className={asset.isActive ? 'active-asset' : ''}>
                {asset.fileName} - v{asset.version} {asset.isActive ? '(actif)' : ''}
              </span>
            ))}
          </div>
        </form>

        {message ? <div className="toast inline">{message}</div> : null}
      </section>
    </div>
  );
}
