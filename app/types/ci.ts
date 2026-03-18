// app/types/ci.ts
export const DISTRICTS_CI = [
  'Abidjan',
  'Yamoussoukro',
  'Bouaké',
  'Daloa',
  'San-Pédro',
  'Korhogo',
  'Man',
  'Gagnoa',
  'Soubré',
  'Odienné',
  'Bondoukou',
  'Séguéla',
  'Divo',
  'Bouaflé',
  'Touba'
];

export const COMMUNES_ABIDJAN = [
  'Cocody',
  'Plateau',
  'Treichville',
  'Adjamé',
  'Yopougon',
  'Abobo',
  'Koumassi',
  'Marcory',
  'Port-Bouët',
  'Bingerville',
  'Anyama',
  'Attécoubé',
  'Williamsville',
  'Riviera',
  'Deux-Plateaux'
];

export const TYPES_BIENS_CI = [
  { value: 'APPARTEMENT', label: 'Appartement', icone: '🏢' },
  { value: 'MAISON', label: 'Maison', icone: '🏠' },
  { value: 'VILLA', label: 'Villa', icone: '🏛️' },
  { value: 'STUDIO', label: 'Studio', icone: '🏢' },
  { value: 'COMMERCIAL', label: 'Local commercial', icone: '🏪' },
  { value: 'TERRAIN', label: 'Terrain', icone: '🌲' },
  { value: 'ENTREPOT', label: 'Entrepôt', icone: '🏭' },
  { value: 'BUREAU', label: 'Bureau', icone: '🏢' }
];

export const STATUTS_BIENS_CI = [
  { value: 'DISPONIBLE', label: 'Disponible', couleur: '#10b981' },
  { value: 'LOUE', label: 'Loué', couleur: '#3b82f6' },
  { value: 'EN_TRAVAUX', label: 'En travaux', couleur: '#f59e0b' },
  { value: 'EN_VENTE', label: 'En vente', couleur: '#8b5cf6' },
  { value: 'RESERVE', label: 'Réservé', couleur: '#ec4899' }
];

export const QUARTIERS_CI: Record<string, string[]> = {
  'Cocody': ['Riviera', 'Deux-Plateaux', 'Angré', 'Palmeraie', 'Bonoumin', 'Saint-Jean', 'Mermoz'],
  'Plateau': ['Zone 4', 'Zone 5', 'Indénié', 'Danga'],
  'Yopougon': ['Siporex', 'Kouté', 'Selmer', 'Toit-Rouge', 'Niangon', 'Andokoi'],
  'Abobo': ['Baoulé', 'Kennedy', 'Anador', 'PK 18'],
  'Marcory': ['Zone 4', 'Anoumabo', 'Biétry'],
  'Koumassi': ['Grands Moulins', 'Remblais', 'Sogefia'],
  'Port-Bouët': ['Vridi', 'Cité Verte']
};