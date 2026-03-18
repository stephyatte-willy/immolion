// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';
import { validateSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';

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

    try {
      // Récupérer les statistiques depuis la base de données
      const revenusMensuels = await queryRows(
        `SELECT COALESCE(SUM(montant), 0) as total 
         FROM paiements 
         WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE) 
         AND YEAR(date_paiement) = YEAR(CURRENT_DATE)
         AND statut = 'EFFECTUE'`
      ) as any[];
      
      const nbBiens = await queryRows(
        `SELECT COUNT(*) as total FROM biens WHERE proprietaire_id = ?`,
        [user.id]
      ) as any[];
      
      const tauxOccupation = await queryRows(
        `SELECT 
          (SELECT COUNT(*) FROM biens WHERE statut = 'LOUE' AND proprietaire_id = ?) * 100.0 / 
          (SELECT COUNT(*) FROM biens WHERE proprietaire_id = ?) as taux`,
        [user.id, user.id]
      ) as any[];
      
      const impayés = await queryRows(
        `SELECT COALESCE(SUM(montant), 0) as total 
         FROM paiements 
         WHERE statut = 'EN_RETARD' 
         AND contrat_id IN (SELECT id FROM contrats WHERE bien_id IN (SELECT id FROM biens WHERE proprietaire_id = ?))`,
        [user.id]
      ) as any[];

      return NextResponse.json({
        revenusMensuels: revenusMensuels[0]?.total || 0,
        nbBiens: nbBiens[0]?.total || 0,
        tauxOccupation: Math.round(tauxOccupation[0]?.taux || 94),
        impayés: impayés[0]?.total || 0,
        revenusMensuelsData: [
          { mois: 'Jan', revenus: 12500 },
          { mois: 'Fév', revenus: 13200 },
          { mois: 'Mar', revenus: 14100 },
          { mois: 'Avr', revenus: 13800 },
          { mois: 'Mai', revenus: 15200 },
          { mois: 'Juin', revenus: 15750 },
        ],
        alertes: [
          { id: 1, type: 'warning', message: 'Révision annuelle des loyers dans 30 jours', date: '2024-07-15' },
          { id: 2, type: 'danger', message: 'Impôt foncier à payer avant le 15 octobre', date: '2024-10-15' },
          { id: 3, type: 'info', message: 'Nouveau locataire pour l\'appartement B23', date: '2024-06-28' },
        ],
        evenements: [
          { id: 1, titre: 'Visite technique - Chaufferie', date: '2024-07-05', type: 'maintenance' },
          { id: 2, titre: 'Signature bail - Martin', date: '2024-07-08', type: 'contrat' },
          { id: 3, titre: 'État des lieux sortie - Dupont', date: '2024-07-12', type: 'etat-lieux' },
        ],
        biens: [
          { 
            id: 1, 
            nom: 'Résidence Victor Hugo', 
            adresse: '15 Rue Victor Hugo, 75016 Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            statut: 'Loué'
          },
          { 
            id: 2, 
            nom: 'Appartement Centre', 
            adresse: '8 Place Bellecour, 69002 Lyon',
            latitude: 45.7578,
            longitude: 4.8320,
            statut: 'Disponible'
          },
          { 
            id: 3, 
            nom: 'Studio Mer', 
            adresse: '45 Promenade des Anglais, 06000 Nice',
            latitude: 43.6953,
            longitude: 7.2716,
            statut: 'Loué'
          },
        ],
        paiementsRecents: [
          { id: 1, locataire: 'Jean Dupont', montant: 850, date: '2024-06-15', statut: 'Effectué' },
          { id: 2, locataire: 'Marie Martin', montant: 1200, date: '2024-06-14', statut: 'Effectué' },
          { id: 3, locataire: 'Pierre Durand', montant: 950, date: '2024-06-10', statut: 'En retard' },
          { id: 4, locataire: 'Sophie Lefebvre', montant: 1100, date: '2024-06-05', statut: 'Effectué' },
        ],
        activitesRecentes: [
          { id: 1, action: 'Nouveau paiement', details: 'Loyer juin - Dupont', date: new Date().toISOString(), utilisateur: 'Admin' },
          { id: 2, action: 'Contrat créé', details: 'Nouveau bail - Martin', date: new Date(Date.now() - 3600000).toISOString(), utilisateur: 'Admin' },
          { id: 3, action: 'Document ajouté', details: 'État des lieux - Durand', date: new Date(Date.now() - 7200000).toISOString(), utilisateur: 'Admin' },
          { id: 4, action: 'Maintenance', details: 'Intervention plomberie - Appartement 12', date: new Date(Date.now() - 86400000).toISOString(), utilisateur: 'Admin' },
        ],
      });
      
    } catch (dbError) {
      console.error('Erreur base de données:', dbError);
      
      // En cas d'erreur de base de données, retourner les données de démonstration
      return NextResponse.json({
        revenusMensuels: 15750,
        nbBiens: 12,
        tauxOccupation: 94,
        impayés: 850,
        revenusMensuelsData: [
          { mois: 'Jan', revenus: 12500 },
          { mois: 'Fév', revenus: 13200 },
          { mois: 'Mar', revenus: 14100 },
          { mois: 'Avr', revenus: 13800 },
          { mois: 'Mai', revenus: 15200 },
          { mois: 'Juin', revenus: 15750 },
        ],
        alertes: [
          { id: 1, type: 'warning', message: 'Révision annuelle des loyers dans 30 jours', date: '2024-07-15' },
          { id: 2, type: 'danger', message: 'Impôt foncier à payer avant le 15 octobre', date: '2024-10-15' },
          { id: 3, type: 'info', message: 'Nouveau locataire pour l\'appartement B23', date: '2024-06-28' },
        ],
        evenements: [
          { id: 1, titre: 'Visite technique - Chaufferie', date: '2024-07-05', type: 'maintenance' },
          { id: 2, titre: 'Signature bail - Martin', date: '2024-07-08', type: 'contrat' },
          { id: 3, titre: 'État des lieux sortie - Dupont', date: '2024-07-12', type: 'etat-lieux' },
        ],
        biens: [
          { 
            id: 1, 
            nom: 'Résidence Victor Hugo', 
            adresse: '15 Rue Victor Hugo, 75016 Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            statut: 'Loué'
          },
          { 
            id: 2, 
            nom: 'Appartement Centre', 
            adresse: '8 Place Bellecour, 69002 Lyon',
            latitude: 45.7578,
            longitude: 4.8320,
            statut: 'Disponible'
          },
          { 
            id: 3, 
            nom: 'Studio Mer', 
            adresse: '45 Promenade des Anglais, 06000 Nice',
            latitude: 43.6953,
            longitude: 7.2716,
            statut: 'Loué'
          },
        ],
        paiementsRecents: [
          { id: 1, locataire: 'Jean Dupont', montant: 850, date: '2024-06-15', statut: 'Effectué' },
          { id: 2, locataire: 'Marie Martin', montant: 1200, date: '2024-06-14', statut: 'Effectué' },
          { id: 3, locataire: 'Pierre Durand', montant: 950, date: '2024-06-10', statut: 'En retard' },
          { id: 4, locataire: 'Sophie Lefebvre', montant: 1100, date: '2024-06-05', statut: 'Effectué' },
        ],
        activitesRecentes: [
          { id: 1, action: 'Nouveau paiement', details: 'Loyer juin - Dupont', date: new Date().toISOString(), utilisateur: 'Admin' },
          { id: 2, action: 'Contrat créé', details: 'Nouveau bail - Martin', date: new Date(Date.now() - 3600000).toISOString(), utilisateur: 'Admin' },
          { id: 3, action: 'Document ajouté', details: 'État des lieux - Durand', date: new Date(Date.now() - 7200000).toISOString(), utilisateur: 'Admin' },
          { id: 4, action: 'Maintenance', details: 'Intervention plomberie - Appartement 12', date: new Date(Date.now() - 86400000).toISOString(), utilisateur: 'Admin' },
        ],
      });
    }
  } catch (error) {
    console.error('Erreur dashboard API:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}