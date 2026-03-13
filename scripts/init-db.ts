import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function initializeDatabase() {
  console.log('🦁 Immolion - Initialisation de la base de données');
  console.log('==================================================');
  
  let connection;
  
  try {
    // Connexion à MySQL
    console.log('📡 Connexion à la base de données...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'immolion-scolarion.f.aivencloud.com',
      port: parseInt(process.env.DB_PORT || '23990'),
      user: process.env.DB_USER || 'avnadmin',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'defaultdb',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('✅ Connexion à la base de données établie');
    
    // Vérifier si les tables existent déjà
    const [tables] = await connection.query('SHOW TABLES');
    const tableCount = (tables as any[]).length;
    
    if (tableCount > 0) {
      console.log(`ℹ️  ${tableCount} tables existent déjà dans la base de données`);
      
      // Vérifier si l'utilisateur admin existe
      const [admins] = await connection.query(
        "SELECT * FROM utilisateurs WHERE email = 'admin@immolion.com'"
      );
      
      if ((admins as any[]).length === 0) {
        console.log('👤 Création de l\'utilisateur administrateur...');
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        await connection.execute(
          `INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, role, actif) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['admin@immolion.com', hashedPassword, 'Admin', 'Super', 'ADMIN', true]
        );
        console.log('   ✅ Utilisateur admin créé');
      } else {
        console.log('   ✅ Utilisateur admin existe déjà');
      }
      
      console.log('\n✅ Base de données déjà initialisée!');
      console.log('==================================================');
      await connection.end();
      return;
    }
    
    console.log('\n📦 Création des tables...');
    
    // Table utilisateurs
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        telephone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'PROPRIETAIRE',
        avatar VARCHAR(500),
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        derniere_connexion DATETIME,
        actif BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table utilisateurs créée');
    
    // Table biens
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS biens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proprietaire_id INT NOT NULL,
        nom VARCHAR(255) NOT NULL,
        adresse VARCHAR(255) NOT NULL,
        code_postal VARCHAR(10) NOT NULL,
        ville VARCHAR(100) NOT NULL,
        pays VARCHAR(50) DEFAULT 'France',
        type_bien VARCHAR(50) NOT NULL,
        statut VARCHAR(50) DEFAULT 'DISPONIBLE',
        surface DECIMAL(10,2) NOT NULL,
        pieces INT NOT NULL,
        etage INT,
        dpe VARCHAR(10),
        ges VARCHAR(10),
        annee_construction INT,
        description TEXT,
        loyer_mensuel DECIMAL(10,2) NOT NULL,
        charges DECIMAL(10,2) DEFAULT 0,
        depot_garantie DECIMAL(10,2),
        date_acquisition DATETIME,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (proprietaire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
        INDEX idx_proprietaire (proprietaire_id),
        INDEX idx_ville (ville),
        INDEX idx_statut (statut)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table biens créée');
    
    // Table locataires
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS locataires (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bien_id INT,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telephone VARCHAR(20),
        telephone_secondaire VARCHAR(20),
        date_naissance DATE,
        profession VARCHAR(100),
        employeur VARCHAR(255),
        revenus_mensuels DECIMAL(10,2),
        pieces_jointes JSON,
        date_entree DATETIME,
        date_sortie DATETIME,
        actif BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE SET NULL,
        INDEX idx_email (email),
        INDEX idx_bien (bien_id),
        INDEX idx_actif (actif)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table locataires créée');
    
    // Table contrats
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contrats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bien_id INT NOT NULL,
        locataire_id INT NOT NULL,
        numero_contrat VARCHAR(50) UNIQUE NOT NULL,
        type_contrat VARCHAR(50) DEFAULT 'BAIL_VIDE',
        date_debut DATE NOT NULL,
        date_fin DATE,
        date_signature DATE,
        loyer_mensuel DECIMAL(10,2) NOT NULL,
        charges_mensuelles DECIMAL(10,2) DEFAULT 0,
        depot_garantie DECIMAL(10,2) NOT NULL,
        statut VARCHAR(50) DEFAULT 'ACTIF',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
        FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE CASCADE,
        INDEX idx_bien (bien_id),
        INDEX idx_locataire (locataire_id),
        INDEX idx_numero (numero_contrat),
        INDEX idx_statut (statut)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table contrats créée');
    
    // Table paiements
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS paiements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contrat_id INT NOT NULL,
        bien_id INT NOT NULL,
        locataire_id INT NOT NULL,
        gestionnaire_id INT,
        type_paiement VARCHAR(50) NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        date_paiement DATETIME NOT NULL,
        mode_paiement VARCHAR(50) NOT NULL,
        reference VARCHAR(100) UNIQUE,
        statut VARCHAR(50) DEFAULT 'EFFECTUE',
        mois_concerne VARCHAR(7),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contrat_id) REFERENCES contrats(id) ON DELETE CASCADE,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
        FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE CASCADE,
        FOREIGN KEY (gestionnaire_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
        INDEX idx_contrat (contrat_id),
        INDEX idx_bien (bien_id),
        INDEX idx_locataire (locataire_id),
        INDEX idx_statut (statut),
        INDEX idx_date_paiement (date_paiement)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table paiements créée');
    
    // Table photos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bien_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        legende VARCHAR(255),
        est_principale BOOLEAN DEFAULT FALSE,
        ordre INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
        INDEX idx_bien (bien_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table photos créée');
    
    // Table documents
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bien_id INT,
        locataire_id INT,
        contrat_id INT,
        type_document VARCHAR(50) NOT NULL,
        nom VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        taille INT,
        date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
        FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE CASCADE,
        FOREIGN KEY (contrat_id) REFERENCES contrats(id) ON DELETE CASCADE,
        INDEX idx_bien (bien_id),
        INDEX idx_locataire (locataire_id),
        INDEX idx_contrat (contrat_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table documents créée');
    
    // Table depenses
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS depenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bien_id INT NOT NULL,
        type_depense VARCHAR(50) NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        date_depense DATE NOT NULL,
        fournisseur VARCHAR(255),
        description TEXT,
        justificatif VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
        INDEX idx_bien (bien_id),
        INDEX idx_date (date_depense)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table depenses créée');
    
    // Table taches
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS taches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bien_id INT NOT NULL,
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        priorite VARCHAR(50) DEFAULT 'MOYENNE',
        statut VARCHAR(50) DEFAULT 'A_FAIRE',
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_echeance DATETIME,
        cout_estime DECIMAL(10,2),
        cout_reel DECIMAL(10,2),
        prestataire VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
        INDEX idx_bien (bien_id),
        INDEX idx_statut (statut)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table taches créée');
    
    // Table statistiques_biens
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS statistiques_biens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bien_id INT NOT NULL,
        mois VARCHAR(7) NOT NULL,
        loyer_percu DECIMAL(10,2) DEFAULT 0,
        charges_percues DECIMAL(10,2) DEFAULT 0,
        depenses DECIMAL(10,2) DEFAULT 0,
        impayes DECIMAL(10,2) DEFAULT 0,
        taux_occupation DECIMAL(5,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
        UNIQUE KEY unique_bien_mois (bien_id, mois),
        INDEX idx_bien (bien_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table statistiques_biens créée');
    
    // Table notifications
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utilisateur_id INT NOT NULL,
        titre VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'INFO',
        lien VARCHAR(500),
        lu BOOLEAN DEFAULT FALSE,
        date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
        INDEX idx_utilisateur (utilisateur_id),
        INDEX idx_lu (lu)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table notifications créée');
    
    // Table sessions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utilisateur_id INT NOT NULL,
        token VARCHAR(500) UNIQUE NOT NULL,
        date_expiration DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expiration (date_expiration)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table sessions créée');
    
    // Table activites
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utilisateur_id INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        details JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
        INDEX idx_utilisateur (utilisateur_id),
        INDEX idx_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ Table activites créée');
    
    console.log('\n✅ Toutes les tables ont été créées avec succès!');
    
    // Création d'un utilisateur admin par défaut
    console.log('\n👤 Création de l\'utilisateur administrateur...');
    
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    await connection.execute(`
      INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, role, actif)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin@immolion.com', hashedPassword, 'Admin', 'Super', 'ADMIN', true]);
    
    console.log('   ✅ Utilisateur admin créé: admin@immolion.com / Admin123!');
    
    console.log('\n==================================================');
    console.log('🎉 Initialisation terminée avec succès!');
    console.log('==================================================');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter l'initialisation
initializeDatabase();