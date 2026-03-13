-- Table de configuration générale
CREATE TABLE IF NOT EXISTS configuration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Thème et apparence
    theme_mode VARCHAR(20) DEFAULT 'dark', -- 'dark', 'light', 'system'
    couleur_principale VARCHAR(20) DEFAULT '#8B5CF6',
    couleur_secondaire VARCHAR(20) DEFAULT '#4F46E5',
    couleur_accent VARCHAR(20) DEFAULT '#EC4899',
    font_family VARCHAR(100) DEFAULT 'Inter',
    
    -- Régional
    langue VARCHAR(10) DEFAULT 'fr',
    fuseau_horaire VARCHAR(50) DEFAULT 'Africa/Abidjan',
    format_date VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    format_heure VARCHAR(20) DEFAULT 'HH:mm',
    premier_jour_semaine INT DEFAULT 1, -- 1 = Lundi, 0 = Dimanche
    
    -- Monnaie
    monnaie VARCHAR(10) DEFAULT 'XOF',
    symbole_monnaie VARCHAR(5) DEFAULT 'FCFA',
    position_monnaie VARCHAR(10) DEFAULT 'after', -- 'before' ou 'after'
    decimales_monnaie INT DEFAULT 0,
    separateur_milliers VARCHAR(1) DEFAULT ' ',
    separateur_decimal VARCHAR(1) DEFAULT ',',
    
    -- Application
    nom_application VARCHAR(100) DEFAULT 'ImmoLion',
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    email_contact VARCHAR(255),
    telephone_contact VARCHAR(20),
    adresse_contact TEXT,
    
    -- Notifications
    notifications_email BOOLEAN DEFAULT TRUE,
    notifications_sms BOOLEAN DEFAULT FALSE,
    notifications_push BOOLEAN DEFAULT TRUE,
    
    -- Sécurité
    session_timeout INT DEFAULT 30, -- minutes
    tentative_connexion_max INT DEFAULT 5,
    verrouillage_compte INT DEFAULT 15, -- minutes
    
    -- Métadonnées
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer une configuration par défaut
INSERT INTO configuration (
    theme_mode, couleur_principale, couleur_secondaire, couleur_accent,
    langue, fuseau_horaire, monnaie, symbole_monnaie,
    nom_application, notifications_email
) VALUES (
    'dark', '#8B5CF6', '#4F46E5', '#EC4899',
    'fr', 'Africa/Abidjan', 'XOF', 'FCFA',
    'ImmoLion', TRUE
) ON DUPLICATE KEY UPDATE id = id;