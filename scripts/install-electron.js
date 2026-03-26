// scripts/install-electron.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installation de l\'exécutable ImmoLion...\n');

// Vérifier les dépendances
console.log('📦 Installation des dépendances Electron...');
execSync('npm install electron electron-builder wait-on concurrently --save-dev', { stdio: 'inherit' });

// Créer le dossier electron s'il n'existe pas
const electronDir = path.join(__dirname, '..', 'electron');
if (!fs.existsSync(electronDir)) {
  fs.mkdirSync(electronDir);
}

console.log('\n✅ Installation terminée !');
console.log('\n📝 Commandes disponibles :');
console.log('   npm run electron:dev    - Lancer en mode développement');
console.log('   npm run dist            - Créer l\'exécutable');
console.log('   npm run dist:win        - Créer l\'exécutable Windows');
console.log('   npm run dist:mac        - Créer l\'exécutable Mac');
console.log('   npm run dist:linux      - Créer l\'exécutable Linux');