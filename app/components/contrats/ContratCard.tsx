'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import { STATUTS_CONTRAT, TYPES_CONTRAT } from '@/app/types/contrats';
import '@/app/locataires/locataires.css';

interface ContratCardProps {
  contrat: any;
  onView: (id: number) => void;
  onEdit: (contrat: any) => void;
  onDelete?: (id: number) => void;
  onAddPaiement?: (contrat: any) => void;
  isCompact?: boolean;
}

export default function ContratCard({ 
  contrat, 
  onView, 
  onEdit, 
  onDelete, 
  onAddPaiement,
  isCompact = false 
}: ContratCardProps) {
  const { formatMoney, formatDate } = useTheme();

  // ✅ Sécurisation
  const contratData = contrat || {};

  const getStatutInfo = (statut: string) => {
    const statutObj = STATUTS_CONTRAT.find(s => s.value === statut) || STATUTS_CONTRAT[1];
    return {
      label: statutObj?.label || 'Inconnu',
      couleur: statutObj?.couleur || '#94a3b8'
    };
  };

  const getTypeInfo = (type: string) => {
    const typeObj = TYPES_CONTRAT.find(t => t.value === type) || TYPES_CONTRAT[0];
    return {
      label: typeObj?.label || 'Contrat',
      icone: typeObj?.icone || '📄'
    };
  };

  const statutInfo = getStatutInfo(contratData.statut);
  const typeInfo = getTypeInfo(contratData.type_contrat);
  
  // ✅ Déterminer si c'est une vente (type_contrat = 'VENTE')
  const isVente = contratData.type_contrat === 'VENTE';

  // ✅ Valeurs selon le type de contrat
  const prixVente = isVente ? (contratData.prix_vente || 0) : 0;
  const loyerMensuel = !isVente ? (contratData.loyer_mensuel || 0) : 0;
  const chargesMensuelles = !isVente ? (contratData.charges_mensuelles || 0) : 0;
  const depotGarantie = !isVente ? (contratData.depot_garantie || 0) : 0;

  const isActif = contratData.statut === 'ACTIF';

  // Formatage des dates
  const dateDebut = contratData.date_debut ? formatDate(contratData.date_debut) : 'Non définie';
  const dateFin = contratData.date_fin ? formatDate(contratData.date_fin) : null;

  if (isCompact) {
    // Version compacte
    return (
      <motion.div 
        className="contrat-card compact"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => onView(contratData.id)}
      >
        <div className="contrat-card-header">
          <div className="contrat-type-icon" title={typeInfo.label}>
            {typeInfo.icone}
          </div>
          <div className="contrat-info-compact">
            <div className="contrat-numero">{contratData.numero_contrat || 'N° inconnu'}</div>
            <div className="contrat-periode">
              {isVente ? 'Vente' : dateDebut}
            </div>
          </div>
          <div 
            className="contrat-statut-badge"
            style={{ 
              background: `${statutInfo.couleur}20`,
              color: statutInfo.couleur
            }}
          >
            {statutInfo.label}
          </div>
        </div>
        <div className="contrat-card-body">
          <div className="contrat-loyer">
            <span className="loyer-label">{isVente ? 'Prix' : 'Loyer'}</span>
            <span className="loyer-valeur">
              {formatMoney(isVente ? (contratData.prix_vente || 0) : (contratData.loyer_mensuel || 0))}
            </span>
          </div>
          {contratData.bien_nom && (
            <div className="contrat-bien-mini">
              <span className="bien-icon">🏠</span>
              <span className="bien-nom">{contratData.bien_nom}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Version détaillée
  return (
    <motion.div 
      className="contrat-card detailed"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="contrat-card-header">
        <div className="contrat-type-section">
          <div className="contrat-type-icon large">{typeInfo.icone}</div>
          <div className="contrat-type-label">{typeInfo.label}</div>
        </div>
        <div 
          className="contrat-statut-badge large"
          style={{ 
            background: `${statutInfo.couleur}20`,
            color: statutInfo.couleur,
            borderColor: `${statutInfo.couleur}40`
          }}
        >
          {statutInfo.label}
        </div>
      </div>

      <div className="contrat-card-body">
        <div className="contrat-numero-section">
          <span className="numero-label">N° contrat</span>
          <span className="numero-valeur">{contratData.numero_contrat || 'N° inconnu'}</span>
        </div>

        <div className="contrat-dates">
          <div className="date-item">
            <span className="date-icon">📅</span>
            <span className="date-label">Date:</span>
            <span className="date-valeur">{dateDebut}</span>
          </div>
          {!isVente && dateFin && (
            <div className="date-item">
              <span className="date-icon">⏱️</span>
              <span className="date-label">Fin:</span>
              <span className="date-valeur">{dateFin}</span>
            </div>
          )}
        </div>

        <div className="contrat-finances">
          {isVente ? (
            // ✅ Affichage pour une vente
            <div className="finance-item">
              <span className="finance-label">Prix de vente</span>
              <span className="finance-valeur highlight">{formatMoney(prixVente)}</span>
            </div>
          ) : (
            // ✅ Affichage pour une location
            <>
              <div className="finance-item">
                <span className="finance-label">Loyer mensuel</span>
                <span className="finance-valeur highlight">{formatMoney(loyerMensuel)}</span>
              </div>
              {chargesMensuelles > 0 && (
                <div className="finance-item">
                  <span className="finance-label">Charges</span>
                  <span className="finance-valeur">{formatMoney(chargesMensuelles)}</span>
                </div>
              )}
              {depotGarantie > 0 && (
                <div className="finance-item">
                  <span className="finance-label">Dépôt de garantie</span>
                  <span className="finance-valeur">{formatMoney(depotGarantie)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Informations du bien */}
        {contratData.bien && (
  <div className="contrat-bien">
    <span className="bien-icon">🏠</span>
    <div className="bien-info">
      <div className="bien-nom">{contratData.bien.nom || 'Bien'}</div>
      <div className="bien-adresse">
        {contratData.bien.adresse ? 
          `${contratData.bien.adresse}, ${contratData.bien.commune || ''}`.replace(/, $/, '') 
          : 'Adresse non disponible'}
      </div>
      {isVente && contratData.bien.prix_vente && (
        <div className="bien-prix-vente">
          <small>Prix du bien: {formatMoney(contratData.bien.prix_vente)}</small>
        </div>
      )}
    </div>
  </div>
)}

        {/* Informations du locataire */}
        {contratData.locataire && (
          <div className="contrat-locataire">
            <span className="locataire-icon">👤</span>
            <div className="locataire-info">
              <div className="locataire-nom">
                {contratData.locataire.prenom || ''} {contratData.locataire.nom || ''}
              </div>
              <div className="locataire-contact">{contratData.locataire.email || ''}</div>
            </div>
          </div>
        )}

        {/* Clauses particulières */}
        {contratData.clause_particuliere && (
          <div className="contrat-clause">
            <span className="clause-icon">📝</span>
            <p className="clause-texte">{contratData.clause_particuliere}</p>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="contrat-card-footer">
        <button 
          className="action-btn view"
          onClick={() => onView(contratData.id)}
          title="Voir détails"
        >
          👁️
        </button>
        <button 
          className="action-btn edit"
          onClick={() => onEdit(contratData)}
          title="Modifier"
        >
          ✏️
        </button>
        {!isVente && onAddPaiement && isActif && (
          <button 
            className="action-btn payment"
            onClick={() => onAddPaiement(contratData)}
            title="Ajouter un paiement"
          >
            💰
          </button>
        )}
        {onDelete && !isActif && (
          <button 
            className="action-btn delete"
            onClick={() => onDelete(contratData.id)}
            title="Supprimer"
          >
            🗑️
          </button>
        )}
      </div>
    </motion.div>
  );
}