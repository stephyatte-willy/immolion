import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer la configuration
export async function GET() {
  try {
    const configs = await queryRows('SELECT * FROM configuration LIMIT 1') as any[];
    
    if (configs.length === 0) {
      // Créer une config par défaut
      const result = await queryInsert(
        `INSERT INTO configuration (
          theme_mode, couleur_principale, couleur_secondaire, couleur_accent,
          langue, fuseau_horaire, monnaie, symbole_monnaie,
          nom_application, notifications_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['dark', '#8B5CF6', '#4F46E5', '#EC4899', 'fr', 'Africa/Abidjan', 'XOF', 'FCFA', 'ImmoLion', true]
      );
      
      const newConfigs = await queryRows('SELECT * FROM configuration LIMIT 1') as any[];
      return NextResponse.json({ success: true, configuration: newConfigs[0] });
    }
    
    return NextResponse.json({ success: true, configuration: configs[0] });
  } catch (error) {
    console.error('❌ Erreur GET configuration:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour la configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      theme_mode,
      couleur_principale,
      couleur_secondaire,
      couleur_accent,
      font_family,
      langue,
      fuseau_horaire,
      format_date,
      format_heure,
      premier_jour_semaine,
      monnaie,
      symbole_monnaie,
      position_monnaie,
      decimales_monnaie,
      separateur_milliers,
      separateur_decimal,
      nom_application,
      logo_url,
      favicon_url,
      email_contact,
      telephone_contact,
      adresse_contact,
      notifications_email,
      notifications_sms,
      notifications_push,
      session_timeout,
      tentative_connexion_max,
      verrouillage_compte
    } = body;

    // Vérifier si une config existe
    const configs = await queryRows('SELECT id FROM configuration LIMIT 1') as any[];
    
    let result;
    if (configs.length === 0) {
      // Créer
      result = await queryInsert(
        `INSERT INTO configuration (
          theme_mode, couleur_principale, couleur_secondaire, couleur_accent,
          font_family, langue, fuseau_horaire, format_date, format_heure,
          premier_jour_semaine, monnaie, symbole_monnaie, position_monnaie,
          decimales_monnaie, separateur_milliers, separateur_decimal,
          nom_application, logo_url, favicon_url, email_contact,
          telephone_contact, adresse_contact, notifications_email,
          notifications_sms, notifications_push, session_timeout,
          tentative_connexion_max, verrouillage_compte
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          theme_mode, couleur_principale, couleur_secondaire, couleur_accent,
          font_family, langue, fuseau_horaire, format_date, format_heure,
          premier_jour_semaine, monnaie, symbole_monnaie, position_monnaie,
          decimales_monnaie, separateur_milliers, separateur_decimal,
          nom_application, logo_url, favicon_url, email_contact,
          telephone_contact, adresse_contact, notifications_email ? 1 : 0,
          notifications_sms ? 1 : 0, notifications_push ? 1 : 0,
          session_timeout, tentative_connexion_max, verrouillage_compte
        ]
      );
    } else {
      // Mettre à jour
      result = await queryInsert(
        `UPDATE configuration SET
          theme_mode = ?, couleur_principale = ?, couleur_secondaire = ?, couleur_accent = ?,
          font_family = ?, langue = ?, fuseau_horaire = ?, format_date = ?, format_heure = ?,
          premier_jour_semaine = ?, monnaie = ?, symbole_monnaie = ?, position_monnaie = ?,
          decimales_monnaie = ?, separateur_milliers = ?, separateur_decimal = ?,
          nom_application = ?, logo_url = ?, favicon_url = ?, email_contact = ?,
          telephone_contact = ?, adresse_contact = ?, notifications_email = ?,
          notifications_sms = ?, notifications_push = ?, session_timeout = ?,
          tentative_connexion_max = ?, verrouillage_compte = ?
        WHERE id = ?`,
        [
          theme_mode, couleur_principale, couleur_secondaire, couleur_accent,
          font_family, langue, fuseau_horaire, format_date, format_heure,
          premier_jour_semaine, monnaie, symbole_monnaie, position_monnaie,
          decimales_monnaie, separateur_milliers, separateur_decimal,
          nom_application, logo_url, favicon_url, email_contact,
          telephone_contact, adresse_contact, notifications_email ? 1 : 0,
          notifications_sms ? 1 : 0, notifications_push ? 1 : 0,
          session_timeout, tentative_connexion_max, verrouillage_compte,
          configs[0].id
        ]
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Configuration mise à jour avec succès'
      });
    } else {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erreur PUT configuration:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}