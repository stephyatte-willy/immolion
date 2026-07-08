// app/types/ci.ts
// Données géographiques complètes de la Côte d'Ivoire

// ─────────────────────────────────────────────
// DISTRICTS & RÉGIONS
// ─────────────────────────────────────────────

/**
 * Les 14 districts officiels de Côte d'Ivoire
 * (2 districts autonomes + 12 districts ordinaires)
 */
export const DISTRICTS_CI = [
  // Districts autonomes
  'Abidjan',
  'Yamoussoukro',
  // Districts ordinaires
  'Bas-Sassandra',
  'Comoé',
  'Denguélé',
  'Gôh-Djiboua',
  'Lacs',
  'Lagunes',
  'Marahoué',
  'Montagnes',
  'Sassandra-Marahoué',
  'Savanes',
  'Vallée du Bandama',
  'Woroba',
  'Zanzan',
];

// Liste simplifiée et dédupliquée des principales villes
export const VILLES_CI = [
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
  'Touba',
  'Abengourou',
  'Aboisso',
  'Adzopé',
  'Agboville',
  'Anyama',
  'Grand-Bassam',
  'Bingerville',
  'Bocanda',
  'Bonoua',
  'Boundiali',
  'Dabou',
  'Danané',
  'Dimbokro',
  'Duekoué',
  'Ferkessédougou',
  'Guiglo',
  'Issia',
  'Jacqueville',
  'Katiola',
  'Lakota',
  'Mankono',
  'Mbahiakro',
  'Ouangolodougou',
  'Sakassou',
  'Sinfra',
  'Tabou',
  'Tiassalé',
  'Tiapoum',
  'Tingrela',
  'Tiébissou',
  'Toumodi',
  'Vavoua',
  'Zuénoula',
];

// ─────────────────────────────────────────────
// COMMUNES D'ABIDJAN
// ─────────────────────────────────────────────

export const COMMUNES_ABIDJAN = [
  'Abobo',
  'Adjamé',
  'Anyama',
  'Attécoubé',
  'Bingerville',
  'Cocody',
  'Koumassi',
  'Marcory',
  'Plateau',
  'Port-Bouët',
  'Treichville',
  'Yopougon',
];

// ─────────────────────────────────────────────
// TYPES ET STATUTS DE BIENS
// ─────────────────────────────────────────────

export const TYPES_BIENS_CI = [
  { value: 'APPARTEMENT', label: 'Appartement', icone: '🏢' },
  { value: 'MAISON', label: 'Maison', icone: '🏠' },
  { value: 'VILLA', label: 'Villa', icone: '🏛️' },
  { value: 'STUDIO', label: 'Studio', icone: '🛋️' },
  { value: 'COMMERCIAL', label: 'Local commercial', icone: '🏪' },
  { value: 'TERRAIN', label: 'Terrain', icone: '🌲' },
  { value: 'ENTREPOT', label: 'Entrepôt', icone: '🏭' },
  { value: 'BUREAU', label: 'Bureau', icone: '🗂️' },
  { value: 'CHAMBRE', label: 'Chambre', icone: '🛏️' },
  { value: 'DUPLEX', label: 'Duplex', icone: '🏘️' },
];

export const STATUTS_BIENS_CI = [
  { value: 'DISPONIBLE', label: 'Disponible', couleur: '#10b981' },
  { value: 'LOUE', label: 'Loué', couleur: '#3b82f6' },
  { value: 'EN_TRAVAUX', label: 'En travaux', couleur: '#f59e0b' },
  { value: 'EN_VENTE', label: 'En vente', couleur: '#8b5cf6' },
  { value: 'VENDU', label: 'Vendu', couleur: '#6b7280' },
  { value: 'RESERVE', label: 'Réservé', couleur: '#ec4899' },
];

// Alias pour compatibilité
export const STATUTS_BIENS = STATUTS_BIENS_CI;

// ─────────────────────────────────────────────
// QUARTIERS PAR COMMUNE — ABIDJAN
// ─────────────────────────────────────────────

export const QUARTIERS_CI: Record<string, string[]> = {

  // ── COCODY ──────────────────────────────────
  'Cocody': [
    'Angré',
    'Angré Château',
    'Angré Djibi',
    'Bonoumin',
    'Cocody Centre',
    'Deux-Plateaux',
    'Deux-Plateaux Vallon',
    'Djibi',
    'Faya',
    'II-Plateaux',
    'Mermoz',
    'Palmeraie',
    'Riviera 1',
    'Riviera 2',
    'Riviera 3',
    'Riviera 4',
    'Riviera Bonoumin',
    'Riviera Golf',
    'Saint-Jean',
    'Blockhauss',
    'Indéniée',
    'Cocody Ambassades',
    'M\'Badon',
    'Anono',
  ],

  // ── PLATEAU ─────────────────────────────────
  'Plateau': [
    'Plateau Centre',
    'Zone 4A',
    'Zone 4B',
    'Zone 4C',
    'Indénié',
    'Danga',
    'Commerce',
    'Cité Administrative',
    'Ébrié',
    'Banque',
    'Hôtel de Ville',
  ],

  // ── TREICHVILLE ─────────────────────────────
  'Treichville': [
    'Treichville Centre',
    'Zone Portuaire',
    'Port',
    'Marché',
    'Rue 12',
    'Rue 24',
    'Cité des Arts',
    'Arras',
    'Village Baoulé',
  ],

  // ── ADJAMÉ ──────────────────────────────────
  'Adjamé': [
    'Adjamé Centre',
    'Adjamé-Liberté',
    'Adjamé 220 Logements',
    'Boucle du Cacao',
    'Caval',
    'Fraternité',
    'Gare Nord',
    'Gbêkê',
    'Williamsville',
    'Ancien Carrefour',
    'Anador',
  ],

  // ── YOPOUGON ────────────────────────────────
  'Yopougon': [
    'Andokoi',
    'Banco',
    'Coulibaly',
    'Doukouré',
    'Ficgayo',
    'Génie 2000',
    'Gesco',
    'Guiro',
    'Koweït',
    'Kouté',
    'Lavage',
    'Maroc',
    'Niangon Nord',
    'Niangon Sud',
    'Nouveau Quartier',
    'Selmer',
    'Siporex',
    'Toit-Rouge',
    'Washington',
    'Yao Séhi',
    'Zone Industrielle',
    'Toits-Rouges',
    'Ananeraie',
  ],

  // ── ABOBO ───────────────────────────────────
  'Abobo': [
    'Abobo Baoulé',
    'Abobo Centre',
    'Abobo Est',
    'Abobo Gare',
    'Abobo Nord',
    'Abobo Ouest',
    'Abobo Sud',
    'Anador',
    'Banco 1',
    'Banco 2',
    'Derrière Rails',
    'Djèdjè',
    'PK 18',
    'PK 24',
    'PK 26',
    'Kennedy',
    'M\'Pouto',
    'N\'Dotré',
    'Sagbé',
    'Samaké',
    'Sofia',
    'Zone Industrielle',
    'Clouetcha',
    'Agnissankoi',
  ],

  // ── KOUMASSI ────────────────────────────────
  'Koumassi': [
    'Bata',
    'Campement',
    'Entrepôts',
    'Extension',
    'Grand Campement',
    'Grands Moulins',
    'Koumassi Centre',
    'Remblais',
    'Sogefia',
    'Zone Industrielle',
    'Résidentiel',
    'Deux Nations',
  ],

  // ── MARCORY ─────────────────────────────────
  'Marcory': [
    'Anoumabo',
    'Biétry',
    'Marcory Centre',
    'Marcory Résidentiel',
    'Sans-Fil',
    'Zone 4',
    'Zone 4 Bord de Mer',
  ],

  // ── PORT-BOUËT ──────────────────────────────
  'Port-Bouët': [
    'Aéroport',
    'Akromiabla',
    'Anani',
    'Bassam',
    'Cité Verte',
    'Gonzagueville',
    'Koumassi Extension',
    'Petit Bassam',
    'Port-Bouët Centre',
    'Vridi 1',
    'Vridi 2',
    'Vridi Canal',
    'Zone Industrielle',
    'Adjouffou',
  ],

  // ── ATTÉCOUBÉ ───────────────────────────────
  'Attécoubé': [
    'Abatta',
    'Agban Village',
    'Attécoubé Centre',
    'Blokosso',
    'Boribana',
    'Bracodi',
    'Gbintimankoi',
    'Locodjro',
    'Santé',
    'Sébroko',
    'Washington',
    'Zoo',
    'Ancien Zoo',
  ],

  // ── BINGERVILLE ─────────────────────────────
  'Bingerville': [
    'Bingerville Centre',
    'Blockhauss',
    'Cité des Arts',
    'Cité SIR',
    'Derrière Prison',
    'Lycée Bingerville',
    'M\'Badon',
    'Moossou',
    'N\'Zidji',
    'Nouveau Quartier',
    'Palmeraie',
  ],

  // ── ANYAMA ──────────────────────────────────
  'Anyama': [
    'Anyama Centre',
    'Adjamé Village',
    'Ahouabo',
    'Akoupé-Zeudji',
    'Anyama Libreville',
    'Dok',
    'N\'Dotré',
    'Songon-Kassemble',
  ],

  // ─────────────────────────────────────────────
  // AUTRES GRANDES VILLES
  // ─────────────────────────────────────────────

  // ── BOUAKÉ ──────────────────────────────────
  'Bouaké': [
    'Air France',
    'Bouaké Centre',
    'Broukro',
    'Dar-es-Salam',
    'Emirates',
    'Gonfreville',
    'Koko',
    'Kôkô Nord',
    'N\'Gattakro',
    'N\'Guessan-Blé',
    'Nimbo',
    'Ouarebo',
    'Sokoura',
    'Zone Industrielle',
    'Ahougnanfoutou',
    'Belleville',
    'Kennedy',
    'Résidentiel',
    'Djébonoua',
    'Kouassi-Kouassikro',
  ],

  // ── YAMOUSSOUKRO ────────────────────────────
  'Yamoussoukro': [
    'Assabou',
    'Datékro',
    'Dioulakro',
    'Fétékro',
    'Habitat',
    'Millionnaire',
    'N\'Guessankro',
    'N\'Zi',
    'Quartier Administratif',
    'Quartier du Lycée',
    'Sopim',
    'Zone Industrielle',
    'Kokrékro',
    'Morofé',
    'Résidentiel',
  ],

  // ── DALOA ───────────────────────────────────
  'Daloa': [
    'Bakoville',
    'Daloa Centre',
    'Gbokora',
    'Gobapleu',
    'Jean Folly',
    'Lobia',
    'Orly',
    'Pont',
    'Quartier Commerce',
    'Résidentiel',
    'Tchinwaly',
    'Soleil',
    'Boïda',
    'Ouragahio',
  ],

  // ── SAN-PÉDRO ───────────────────────────────
  'San-Pédro': [
    'Bardo',
    'Bardo-Plage',
    'Cité Port',
    'Grand-Béréby',
    'Indenié',
    'Kpanan',
    'Lac',
    'Plage',
    'San-Pédro Centre',
    'Zone Industrielle',
    'Zone Portuaire',
    'Bakanda',
  ],

  // ── KORHOGO ─────────────────────────────────
  'Korhogo': [
    'Administratif',
    'Air France',
    'Dioulabougou',
    'Extension',
    'Habitat',
    'Koko',
    'Korhogo Centre',
    'Koko Kombolokoura',
    'Montoro',
    'N\'Gorankaha',
    'Résidentiel',
    'Soba',
    'Zone Industrielle',
    'Kassimsé',
  ],

  // ── MAN ─────────────────────────────────────
  'Man': [
    'Administratif',
    'Carrefour',
    'Commerce',
    'Kouibly',
    'Man Centre',
    'Résidentiel',
    'Zone Militaire',
    'Gare',
    'Dan',
    'Sobly',
  ],

  // ── GAGNOA ──────────────────────────────────
  'Gagnoa': [
    'Administratif',
    'Boya',
    'Commerce',
    'Extension',
    'Gagnoa Centre',
    'Habitat',
    'Préfecture',
    'Résidentiel',
    'Zone Industrielle',
    'Brobo',
  ],

  // ── SOUBRÉ ──────────────────────────────────
  'Soubré': [
    'Administratif',
    'Cité Sucrière',
    'Commerce',
    'Extension',
    'Habitat',
    'Soubré Centre',
    'Zone Industrielle',
  ],

  // ── ODIENNÉ ─────────────────────────────────
  'Odienné': [
    'Administratif',
    'Commerce',
    'Habitat',
    'Kadiola',
    'Odienné Centre',
    'Résidentiel',
  ],

  // ── BONDOUKOU ───────────────────────────────
  'Bondoukou': [
    'Administratif',
    'Bondoukou Centre',
    'Commerce',
    'Dodo',
    'Habitat',
    'N\'Kronkwanta',
    'Résidentiel',
    'Tékérédougou',
  ],

  // ── SÉGUÉLA ─────────────────────────────────
  'Séguéla': [
    'Administratif',
    'Commerce',
    'Habitat',
    'Résidentiel',
    'Séguéla Centre',
  ],

  // ── DIVO ────────────────────────────────────
  'Divo': [
    'Administratif',
    'Baya',
    'Commerce',
    'Extension',
    'Divo Centre',
    'Habitat',
    'Résidentiel',
    'Zone Industrielle',
  ],

  // ── BOUAFLÉ ─────────────────────────────────
  'Bouaflé': [
    'Administratif',
    'Bouaflé Centre',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── TOUBA ───────────────────────────────────
  'Touba': [
    'Administratif',
    'Commerce',
    'Habitat',
    'Résidentiel',
    'Touba Centre',
  ],

  // ── ABENGOUROU ──────────────────────────────
  'Abengourou': [
    'Administratif',
    'Abengourou Centre',
    'Amanvi',
    'Commerce',
    'Extension',
    'Habitat',
    'Kékrénou',
    'Résidentiel',
    'Zone Industrielle',
  ],

  // ── ABOISSO ─────────────────────────────────
  'Aboisso': [
    'Aboisso Centre',
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── GRAND-BASSAM ────────────────────────────
  'Grand-Bassam': [
    'Ancien Bassam',
    'Assinie',
    'Azuretti',
    'Braffedon',
    'Cité France',
    'Grand-Bassam Centre',
    'Moossou',
    'N\'Zida',
    'Nouveau Quartier',
    'Résidentiel',
  ],

  // ── DABOU ───────────────────────────────────
  'Dabou': [
    'Administratif',
    'Commerce',
    'Dabou Centre',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Zone Industrielle',
  ],

  // ── DIMBOKRO ────────────────────────────────
  'Dimbokro': [
    'Administratif',
    'Commerce',
    'Dimbokro Centre',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── AGBOVILLE ───────────────────────────────
  'Agboville': [
    'Administratif',
    'Agboville Centre',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── ADZOPÉ ──────────────────────────────────
  'Adzopé': [
    'Adzopé Centre',
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── FERKESSÉDOUGOU ──────────────────────────
  'Ferkessédougou': [
    'Administratif',
    'Cité Sucrière',
    'Commerce',
    'Extension',
    'Ferkessédougou Centre',
    'Habitat',
    'Résidentiel',
    'Zone Industrielle',
  ],

  // ── KATIOLA ─────────────────────────────────
  'Katiola': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Katiola Centre',
    'Résidentiel',
  ],

  // ── ISSIA ───────────────────────────────────
  'Issia': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Issia Centre',
    'Résidentiel',
  ],

  // ── VAVOUA ──────────────────────────────────
  'Vavoua': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Vavoua Centre',
  ],

  // ── TIASSALÉ ────────────────────────────────
  'Tiassalé': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Tiassalé Centre',
  ],

  // ── LAKOTA ──────────────────────────────────
  'Lakota': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Lakota Centre',
    'Résidentiel',
  ],

  // ── DUEKOUÉ ─────────────────────────────────
  'Duekoué': [
    'Administratif',
    'Commerce',
    'Duekoué Centre',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── GUIGLO ──────────────────────────────────
  'Guiglo': [
    'Administratif',
    'Commerce',
    'Extension',
    'Guiglo Centre',
    'Habitat',
    'Résidentiel',
  ],

  // ── DANANÉ ──────────────────────────────────
  'Danané': [
    'Administratif',
    'Commerce',
    'Danané Centre',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── MANKONO ─────────────────────────────────
  'Mankono': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Mankono Centre',
    'Résidentiel',
  ],

  // ── BOUNDIALI ───────────────────────────────
  'Boundiali': [
    'Administratif',
    'Boundiali Centre',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── TOUMODI ─────────────────────────────────
  'Toumodi': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Toumodi Centre',
  ],

  // ── TIÉBISSOU ───────────────────────────────
  'Tiébissou': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Tiébissou Centre',
  ],

  // ── TABOU ───────────────────────────────────
  'Tabou': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Tabou Centre',
  ],

  // ── SASSANDRA ───────────────────────────────
  'Sassandra': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Sassandra Centre',
  ],

  // ── BOUNA ───────────────────────────────────
  'Bouna': [
    'Administratif',
    'Bouna Centre',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── TANDA ───────────────────────────────────
  'Tanda': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Tanda Centre',
  ],

  // ── SINFRA ──────────────────────────────────
  'Sinfra': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Sinfra Centre',
  ],

  // ── ZUÉNOULA ────────────────────────────────
  'Zuénoula': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
    'Zuénoula Centre',
  ],

  // ── BOCANDA ─────────────────────────────────
  'Bocanda': [
    'Administratif',
    'Bocanda Centre',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── JACQUEVILLE ─────────────────────────────
  'Jacqueville': [
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Jacqueville Centre',
    'Résidentiel',
  ],

  // ── BONOUA ──────────────────────────────────
  'Bonoua': [
    'Administratif',
    'Bonoua Centre',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],

  // ── ADIAKÉ ──────────────────────────────────
  'Adiaké': [
    'Adiaké Centre',
    'Administratif',
    'Commerce',
    'Extension',
    'Habitat',
    'Résidentiel',
  ],
};

// ─────────────────────────────────────────────
// VILLES PAR DISTRICT
// ─────────────────────────────────────────────

/**
 * Pour chaque district, la liste des villes/communes principales.
 * Le district "Abidjan" utilise COMMUNES_ABIDJAN (select dédié).
 */
export const VILLES_PAR_DISTRICT: Record<string, string[]> = {
  'Abidjan': [
    // Les communes d'Abidjan sont gérées via COMMUNES_ABIDJAN
    // Ce tableau liste les villes hors-commune du district
    'Anyama',
    'Bingerville',
    'Grand-Bassam',
    'Jacqueville',
  ],
  'Yamoussoukro': [
    'Yamoussoukro',
    'Attiégouakro',
    'Djékanou',
    'Tiébissou',
    'Toumodi',
  ],
  'Bas-Sassandra': [
    'San-Pédro',
    'Soubré',
    'Sassandra',
    'Buyo',
    'Gueyo',
    'Méagui',
    'Tabou',
    'Grand-Béréby',
  ],
  'Comoé': [
    'Abengourou',
    'Aboisso',
    'Adiaké',
    'Agnibilékrou',
    'Adiamé',
    'Bianouan',
    'Tanda',
  ],
  'Denguélé': [
    'Odienné',
    'Kaniasso',
    'Minignan',
    'Samatiguila',
  ],
  'Gôh-Djiboua': [
    'Gagnoa',
    'Divo',
    'Lakota',
    'Didizo',
    'Guitry',
    'Gnago',
    'Hiré',
    'Oumé',
  ],
  'Lacs': [
    'Dimbokro',
    'Bocanda',
    'Bongouanou',
    'Daoukro',
    'M\'Bahiakro',
    'Toumodi',
    'Tiébissou',
  ],
  'Lagunes': [
    'Dabou',
    'Grand-Lahou',
    'Jacqueville',
    'Tiassalé',
    'Sikensi',
    'Taabo',
    'Agboville',
    'Adzopé',
    'Akoupé',
    'Affery',
  ],
  'Marahoué': [
    'Bouaflé',
    'Daloa',
    'Sinfra',
    'Zuénoula',
    'Vavoua',
    'Issia',
  ],
  'Montagnes': [
    'Man',
    'Biankouma',
    'Danané',
    'Guiglo',
    'Bangolo',
    'Duekoué',
    'Facobly',
    'Kouibly',
    'Sipilou',
    'Toulépleu',
    'Zouan-Hounien',
  ],
  'Sassandra-Marahoué': [
    'Daloa',
    'Issia',
    'Vavoua',
    'Sinfra',
    'Zoukougbeu',
  ],
  'Savanes': [
    'Korhogo',
    'Boundiali',
    'Ferkessédougou',
    'Sinématiali',
    'Tengrela',
    'Dikodougou',
    'Kafolo',
    'M\'Bengué',
    'Napié',
    'Niakara',
    'Ouangolodougou',
    'Kong',
    'Karakoro',
  ],
  'Vallée du Bandama': [
    'Bouaké',
    'Katiola',
    'Béoumi',
    'Botro',
    'Sakassou',
    'Dabakala',
  ],
  'Woroba': [
    'Séguéla',
    'Mankono',
    'Worodougou',
    'Kani',
    'Kounahiri',
    'Morondo',
    'Sifié',
    'Touba',
  ],
  'Zanzan': [
    'Bondoukou',
    'Bouna',
    'Nassian',
    'Tanda',
    'Doropo',
    'Transua',
    'Sandégué',
  ],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Retourne la liste des quartiers pour une commune donnée */
export function getQuartiersByCommune(commune: string): string[] {
  return QUARTIERS_CI[commune] ?? [];
}

/** Retourne toutes les communes disposant de quartiers enregistrés */
export function getCommunesAvecQuartiers(): string[] {
  return Object.keys(QUARTIERS_CI).sort();
}

/** Retourne l'ensemble des quartiers de toutes les communes */
export function getAllQuartiers(): string[] {
  return Object.values(QUARTIERS_CI).flat().sort();
}

/** Retourne true si la commune fait partie d'Abidjan */
export function isCommuneAbidjan(commune: string): boolean {
  return COMMUNES_ABIDJAN.includes(commune);
}

/** Retourne les villes/communes d'un district donné */
export function getVillesByDistrict(district: string): string[] {
  if (district === 'Abidjan') return COMMUNES_ABIDJAN;
  return VILLES_PAR_DISTRICT[district] ?? [];
}

/** Retourne true si une ville possède des quartiers enregistrés */
export function hasQuartiers(ville: string): boolean {
  return ville in QUARTIERS_CI && QUARTIERS_CI[ville].length > 0;
}