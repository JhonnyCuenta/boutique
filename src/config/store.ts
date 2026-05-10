import {
  BadgeCheck,
  Blocks,
  BriefcaseBusiness,
  Cross,
  Gauge,
  MapPinned,
  RadioTower,
  ShieldCheck,
  Siren,
  Skull,
  Star,
  Zap,
} from 'lucide-react';

export const navItems = [
  { href: '/', label: 'Accueil' },
  { href: '/#boutique', label: 'Boutique' },
  { href: '/scripts', label: 'Scripts' },
  { href: '/mapping', label: 'Mapping' },
  { href: '/support', label: 'Support' },
];

export const categoryLabels: Record<string, string> = {
  ALL: 'Tous',
  ESX: 'Scripts ESX',
  QBCORE: 'Scripts QBCore',
  UI_HUD: 'UI/HUD',
  MAPPING_MLO: 'Mapping/MLO',
  ZOMBIES: 'Packs Zombies',
  ANTICHEAT: 'Anticheat',
  JOBS: 'Jobs',
  EMS: 'EMS',
  POLICE: 'Police',
};

export const categoryIcons: Record<string, typeof Zap> = {
  ESX: Blocks,
  QBCORE: RadioTower,
  UI_HUD: Gauge,
  MAPPING_MLO: MapPinned,
  ZOMBIES: Skull,
  ANTICHEAT: ShieldCheck,
  JOBS: BriefcaseBusiness,
  EMS: Cross,
  POLICE: Siren,
};

export const features = [
  { title: 'Optimise', text: 'Scripts penses pour eviter les boucles lourdes et garder un serveur fluide.', icon: Zap },
  { title: 'Support rapide', text: 'Aide installation, corrections et conseils FiveM directement via Discord.', icon: RadioTower },
  { title: 'Mises a jour', text: 'Versions suivies, changelog clair et fichiers remplaces proprement.', icon: BadgeCheck },
  { title: 'Scripts securises', text: 'Callbacks valides, rewards cote serveur et events sensibles proteges.', icon: ShieldCheck },
  { title: 'ESX/QBCore', text: 'Compatibilite annoncee produit par produit, sans surprise a l installation.', icon: Blocks },
];

export const stats = [
  { label: 'Clients satisfaits', value: '250+' },
  { label: 'Scripts vendus', value: '900+' },
  { label: 'Serveurs partenaires', value: '45+' },
  { label: 'Temps support moyen', value: '< 2h' },
];

export const testimonials = [
  {
    name: 'Nassim',
    server: 'RP Marseille',
    text: 'Installation propre, support reactif et interface vraiment premium. Le HUD a change le ressenti du serveur.',
  },
  {
    name: 'Yanis',
    server: 'Atlas City',
    text: 'Les scripts sont clairs, config faciles et aucune surprise cote performance.',
  },
  {
    name: 'Maya',
    server: 'Zone 47',
    text: 'Le pack zombie est parfait pour un RP apocalypse. Les events donnent une vraie tension en jeu.',
  },
];

export const stars = Array.from({ length: 5 }, (_, index) => index);

export { Star };
