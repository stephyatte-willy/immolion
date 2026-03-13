// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supprimez les anciennes propriétés expérimentales comme 'serverActions'
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'immolion-scolarion.f.aivencloud.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configuration explicite de Turbopack (peut être vide pour les paramètres par défaut)
  turbopack: {
    // Vous pouvez ajouter des règles personnalisées ici si nécessaire
    // Exemple pour plus tard : rules: { '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' } }
  },
  // Votre configuration webpack existante (si vous en avez une) reste ici
  webpack: (config, { isServer }) => {
    // Vos configurations webpack personnalisées
    return config;
  },
};

module.exports = nextConfig;