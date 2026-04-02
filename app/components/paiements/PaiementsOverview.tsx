'use client';

import { useTheme } from '@/app/providers/ThemeProvider';
import ContratPaiementsAccordeon from './ContratPaiementsAccordeon';
import './paiements.css';

interface PaiementsOverviewProps {
  paiements: any[];
  onEdit: (paiement: any) => void;
  onDelete: (paiement: any) => void;
  onAddPaiement: (contratId: number, locataireId: number | undefined, acquereurId: number | undefined, bienId: number, type: string) => void;
  onGenerateQuittance: (paiement: any) => void;
}

export default function PaiementsOverview({
  paiements,
  onEdit,
  onDelete,
  onAddPaiement,
  onGenerateQuittance
}: PaiementsOverviewProps) {
  const { formatMoney } = useTheme();

  // Séparer les paiements par type de transaction
  const paiementsLocation = paiements.filter(p => p.type_transaction === 'LOCATION' || !p.type_transaction);
  const paiementsVente = paiements.filter(p => p.type_transaction === 'VENTE');

  // Grouper les paiements de location par contrat
  const paiementsLocationParContrat = paiementsLocation.reduce((acc, paiement) => {
    const contratId = paiement.contrat_id;
    if (!acc[contratId]) {
      acc[contratId] = {
        contrat: {
          id: contratId,
          numero_contrat: paiement.contrat_numero || `Contrat #${contratId}`,
          type_contrat: 'LOCATION',
          locataire: {
            id: paiement.locataire_id,
            nom: paiement.locataire_nom || '',
            prenom: paiement.locataire_prenom || ''
          },
          bien: {
            id: paiement.bien_id,
            nom: paiement.bien_nom || 'Bien'
          }
        },
        paiements: []
      };
    }
    acc[contratId].paiements.push(paiement);
    return acc;
  }, {} as Record<number, any>);

  // Grouper les paiements de vente par contrat
  const paiementsVenteParContrat = paiementsVente.reduce((acc, paiement) => {
    const contratId = paiement.contrat_id;
    if (!acc[contratId]) {
      acc[contratId] = {
        contrat: {
          id: contratId,
          numero_contrat: paiement.contrat_numero || `Contrat #${contratId}`,
          type_contrat: 'VENTE',
          acquereur: {
            id: paiement.acquereur_id,
            nom: paiement.acquereur_nom || '',
            prenom: paiement.acquereur_prenom || ''
          },
          bien: {
            id: paiement.bien_id,
            nom: paiement.bien_nom || 'Bien'
          }
        },
        paiements: []
      };
    }
    acc[contratId].paiements.push(paiement);
    return acc;
  }, {} as Record<number, any>);

  return (
    <div className="paiements-overview">
      {/* Section Locations */}
      {Object.values(paiementsLocationParContrat).length > 0 && (
        <div className="paiements-section-category">
          <div className="category-header">
            <span className="category-icon">🏠</span>
            <h3>Locations</h3>
            <span className="category-count">{Object.values(paiementsLocationParContrat).length} contrat(s)</span>
          </div>
          <div className="paiements-accordeon">
            {Object.values(paiementsLocationParContrat).map((groupe: any) => {
              const bienId = groupe.contrat.bien?.id;
              const locataireId = groupe.contrat.locataire?.id;
              
              return (
                <ContratPaiementsAccordeon
                  key={groupe.contrat.id}
                  contrat={groupe.contrat}
                  paiements={groupe.paiements}
                  onEditPaiement={onEdit}
                  onDeletePaiement={onDelete}
                  onAddPaiement={(contratIdParam, clientId, bienIdParam) => 
                    onAddPaiement(contratIdParam, locataireId, undefined, bienIdParam || bienId, 'LOCATION')
                  }
                  formatMoney={formatMoney}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Section Ventes */}
      {Object.values(paiementsVenteParContrat).length > 0 && (
        <div className="paiements-section-category">
          <div className="category-header">
            <span className="category-icon">💰</span>
            <h3>Ventes</h3>
            <span className="category-count">{Object.values(paiementsVenteParContrat).length} contrat(s)</span>
          </div>
          <div className="paiements-accordeon">
            {Object.values(paiementsVenteParContrat).map((groupe: any) => {
              const bienId = groupe.contrat.bien?.id;
              const acquereurId = groupe.contrat.acquereur?.id;
              
              return (
                <ContratPaiementsAccordeon
                  key={groupe.contrat.id}
                  contrat={groupe.contrat}
                  paiements={groupe.paiements}
                  onEditPaiement={onEdit}
                  onDeletePaiement={onDelete}
                  onAddPaiement={(contratIdParam, clientId, bienIdParam) => 
                    onAddPaiement(contratIdParam, undefined, acquereurId, bienIdParam || bienId, 'VENTE')
                  }
                  formatMoney={formatMoney}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}