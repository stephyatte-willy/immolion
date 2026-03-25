import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';
import { validateSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';
import { hasPermission, Role } from '@/app/types/roles';

// Interface pour les données du tableau de bord
interface DashboardData {
  success: boolean;
  dashboard: {
    kpis: {
      totalBiens: number;
      totalLocataires: number;
      totalContratsActifs: number;
      tauxOccupation: number;
    };
    finances: {
      revenusMoisActuel: number;
      revenusMoisPrecedent: number;
      variationRevenus: number;
      totalImpayes: number;
      totalPenalites: number;
      previsionMensuelle: number;
    } | null;
    evolutionRevenus: { mois: string; revenus: number; annee: number }[];
    repartitionTypes: { type_bien: string; total: number }[];
    topLocataires: {
      id: number;
      nom: string;
      prenom: string;
      nb_paiements: number;
      total_paye: number;
    }[];
    dernieresActivites: {
      type: string;
      id: number;
      valeur: number;
      date: string;
      nom: string;
      details: string;
    }[];
    alertes: {
      id: string;
      type: 'warning' | 'danger' | 'info';
      message: string;
      date: string;
    }[];
    canViewFinances: boolean;
  };
}

// GET - Données du tableau de bord
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, erreur: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const user = await validateSession(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, erreur: 'Session invalide' },
        { status: 401 }
      );
    }

    // ✅ Correction: Typer correctement user.role
    const userRole = user.role as Role;
    const canViewFinances = hasPermission(userRole, 'dashboard:view_finances');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 1. Statistiques générales
    const totalBiens = await queryRows(
      'SELECT COUNT(*) as total FROM biens'
    ) as any[];
    
    const totalLocataires = await queryRows(
      'SELECT COUNT(*) as total FROM locataires WHERE actif = 1'
    ) as any[];
    
    // ✅ CORRECTION: Utiliser des guillemets simples pour les chaînes
    const totalContrats = await queryRows(
      "SELECT COUNT(*) as total FROM contrats WHERE statut = 'ACTIF'"
    ) as any[];
    
    const biensLoues = await queryRows(
      "SELECT COUNT(*) as total FROM biens WHERE statut = 'LOUE'"
    ) as any[];

    const totalBiensValue = totalBiens[0]?.total || 0;
    const biensLouesValue = biensLoues[0]?.total || 0;
    const tauxOccupation = totalBiensValue > 0 
      ? Math.round((biensLouesValue / totalBiensValue) * 100) 
      : 0;

    // 2. Statistiques financières (uniquement si autorisé)
    let finances = {
      revenusMoisActuel: 0,
      revenusMoisPrecedent: 0,
      variationRevenus: 0,
      totalImpayes: 0,
      totalPenalites: 0,
      previsionMensuelle: 0
    };

    if (canViewFinances) {
      const revenusMoisActuel = await queryRows(
        `SELECT COALESCE(SUM(montant), 0) as total 
         FROM paiements 
         WHERE MONTH(date_paiement) = ? 
         AND YEAR(date_paiement) = ?
         AND statut = 'EFFECTUE'`,
        [currentMonth, currentYear]
      ) as any[];
      
      const revenusMoisPrecedent = await queryRows(
        `SELECT COALESCE(SUM(montant), 0) as total 
         FROM paiements 
         WHERE MONTH(date_paiement) = ? 
         AND YEAR(date_paiement) = ?
         AND statut = 'EFFECTUE'`,
        [lastMonth, lastMonthYear]
      ) as any[];
      
      const totalImpayes = await queryRows(
        "SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE statut = 'EN_RETARD'"
      ) as any[];
      
      const totalPenalites = await queryRows(
        "SELECT COALESCE(SUM(penalite), 0) as total FROM paiements WHERE penalite > 0"
      ) as any[];
      
      const previsionMensuelle = await queryRows(
        "SELECT COALESCE(SUM(loyer_mensuel), 0) as total FROM contrats WHERE statut = 'ACTIF'"
      ) as any[];

      const revenusActuel = revenusMoisActuel[0]?.total || 0;
      const revenusPrecedent = revenusMoisPrecedent[0]?.total || 0;
      const variation = revenusPrecedent > 0 
        ? ((revenusActuel - revenusPrecedent) / revenusPrecedent) * 100 
        : 0;

      finances = {
        revenusMoisActuel: revenusActuel,
        revenusMoisPrecedent: revenusPrecedent,
        variationRevenus: variation,
        totalImpayes: totalImpayes[0]?.total || 0,
        totalPenalites: totalPenalites[0]?.total || 0,
        previsionMensuelle: previsionMensuelle[0]?.total || 0
      };
    }

    // 3. Évolution des revenus (12 derniers mois)
    const evolutionRevenus: { mois: string; revenus: number; annee: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const mois = date.getMonth() + 1;
      const annee = date.getFullYear();
      
      const revenus = await queryRows(
        `SELECT COALESCE(SUM(montant), 0) as total 
         FROM paiements 
         WHERE MONTH(date_paiement) = ? 
         AND YEAR(date_paiement) = ?
         AND statut = 'EFFECTUE'`,
        [mois, annee]
      ) as any[];
      
      evolutionRevenus.push({
        mois: date.toLocaleString('fr-FR', { month: 'short' }),
        revenus: revenus[0]?.total || 0,
        annee
      });
    }

    // 4. Répartition par type de bien
    const repartitionTypes = await queryRows(
      `SELECT type_bien, COUNT(*) as total 
       FROM biens 
       GROUP BY type_bien`
    ) as { type_bien: string; total: number }[];

    // 5. Top 5 locataires avec plus de paiements
    const topLocataires = await queryRows(
      `SELECT 
        l.id,
        l.nom,
        l.prenom,
        COUNT(p.id) as nb_paiements,
        COALESCE(SUM(p.montant), 0) as total_paye
       FROM locataires l
       LEFT JOIN paiements p ON l.id = p.locataire_id AND p.statut = 'EFFECTUE'
       GROUP BY l.id
       ORDER BY total_paye DESC
       LIMIT 5`
    ) as { id: number; nom: string; prenom: string; nb_paiements: number; total_paye: number }[];

    // 6. Dernières activités
    const dernieresActivites = await queryRows(
      `(SELECT 
        'paiement' as type,
        p.id,
        p.montant as valeur,
        p.date_paiement as date,
        CONCAT(l.prenom, ' ', l.nom) as nom,
        p.mode_paiement as details
       FROM paiements p
       LEFT JOIN locataires l ON p.locataire_id = l.id
       ORDER BY p.date_paiement DESC
       LIMIT 5)
      UNION ALL
      (SELECT 
        'contrat' as type,
        c.id,
        c.loyer_mensuel as valeur,
        c.created_at as date,
        CONCAT(l.prenom, ' ', l.nom) as nom,
        c.numero_contrat as details
       FROM contrats c
       LEFT JOIN locataires l ON c.locataire_id = l.id
       ORDER BY c.created_at DESC
       LIMIT 5)
      UNION ALL
      (SELECT 
        'bien' as type,
        b.id,
        b.loyer_mensuel as valeur,
        b.created_at as date,
        b.nom as nom,
        b.type_bien as details
       FROM biens b
       ORDER BY b.created_at DESC
       LIMIT 5)
      ORDER BY date DESC
      LIMIT 10`
    ) as { type: string; id: number; valeur: number; date: string; nom: string; details: string }[];

    // 7. Alertes et rappels
    const alertes: { id: string; type: 'warning' | 'danger' | 'info'; message: string; date: string }[] = [];
    
    // Contrats se terminant bientôt (30 jours)
    const contratsExpirant = await queryRows(
      `SELECT c.id, c.numero_contrat, c.date_fin, 
              CONCAT(l.prenom, ' ', l.nom) as locataire
       FROM contrats c
       LEFT JOIN locataires l ON c.locataire_id = l.id
       WHERE c.statut = 'ACTIF' 
       AND c.date_fin IS NOT NULL
       AND c.date_fin BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)`
    ) as { id: number; numero_contrat: string; date_fin: string; locataire: string }[];
    
    contratsExpirant.forEach(c => {
      alertes.push({
        id: `contrat-${c.id}`,
        type: 'warning',
        message: `Contrat ${c.numero_contrat} (${c.locataire}) se termine le ${new Date(c.date_fin).toLocaleDateString('fr-FR')}`,
        date: c.date_fin
      });
    });
    
    // Paiements en retard
    const paiementsRetard = await queryRows(
      `SELECT p.id, p.montant, p.date_echeance,
              CONCAT(l.prenom, ' ', l.nom) as locataire
       FROM paiements p
       LEFT JOIN locataires l ON p.locataire_id = l.id
       WHERE p.statut = 'EN_RETARD'`
    ) as { id: number; montant: number; date_echeance: string; locataire: string }[];
    
    paiementsRetard.forEach(p => {
      alertes.push({
        id: `paiement-${p.id}`,
        type: 'danger',
        message: `Paiement de ${p.montant.toLocaleString()} FCFA en retard (${p.locataire})`,
        date: p.date_echeance
      });
    });

    return NextResponse.json({
      success: true,
      dashboard: {
        // KPIs généraux
        kpis: {
          totalBiens: totalBiens[0]?.total || 0,
          totalLocataires: totalLocataires[0]?.total || 0,
          totalContratsActifs: totalContrats[0]?.total || 0,
          tauxOccupation
        },
        // KPIs financiers (masqués si non autorisé)
        finances: canViewFinances ? finances : null,
        // Graphiques
        evolutionRevenus,
        repartitionTypes,
        // Classements
        topLocataires,
        // Activités récentes
        dernieresActivites,
        // Alertes
        alertes,
        // Indicateur d'accès aux finances
        canViewFinances
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur dashboard:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}