'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TYPES_EVENEMENT, STATUTS_EVENEMENT } from '@/app/types/calendrier';
import '@/app/calendrier/calendrier.css';

interface CalendrierVueProps {
  vue: 'mois' | 'semaine' | 'jour';
  date: Date;
  evenements: any[];
  onViewEvenement: (evenement: any) => void;
  onEditEvenement: (evenement: any) => void;
  onDeleteEvenement: (evenement: any) => void;
}

export default function CalendrierVue({
  vue,
  date,
  evenements,
  onViewEvenement,
  onEditEvenement,
  onDeleteEvenement
}: CalendrierVueProps) {
  const [evenementHover, setEvenementHover] = useState<number | null>(null);

  // Obtenir le type d'événement
  const getTypeInfo = (type: string) => {
    const typeInfo = TYPES_EVENEMENT.find(t => t.value === type) || TYPES_EVENEMENT[0];
    return {
      icone: typeInfo.icone,
      label: typeInfo.label,
      couleur: typeInfo.couleur
    };
  };

  const getStatutInfo = (statut: string) => {
    const statutInfo = STATUTS_EVENEMENT.find(s => s.value === statut) || STATUTS_EVENEMENT[0];
    return {
      label: statutInfo.label,
      couleur: statutInfo.couleur
    };
  };

  // Formatage de l'heure
  const formatHeure = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Formatage de la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Vue Mois
  if (vue === 'mois') {
    const annee = date.getFullYear();
    const mois = date.getMonth();
    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);
    const joursDansMois = dernierJour.getDate();
    const premierJourSemaine = premierJour.getDay() || 7; // Lundi = 1, Dimanche = 7
    
    const jours = [];
    for (let i = 1; i <= joursDansMois; i++) {
      jours.push(new Date(annee, mois, i));
    }

    const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    // Obtenir les événements du jour
    const getEvenementsDuJour = (jour: Date) => {
      const jourStr = jour.toISOString().split('T')[0];
      return evenements.filter(e => e.date_debut?.split('T')[0] === jourStr);
    };

    return (
      <div className="calendrier-mois">
        <div className="calendrier-semaine-header">
          {joursSemaine.map(jour => (
            <div key={jour} className="semaine-jour-header">
              {jour}
            </div>
          ))}
        </div>
        
        <div className="calendrier-jours">
          {Array(premierJourSemaine - 1).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="calendrier-jour vide" />
          ))}
          
          {jours.map((jour, index) => {
            const evenementsJour = getEvenementsDuJour(jour);
            const estAujourdhui = new Date().toDateString() === jour.toDateString();
            
            return (
              <motion.div
                key={index}
                className={`calendrier-jour ${estAujourdhui ? 'aujourdhui' : ''}`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="jour-numero">{jour.getDate()}</div>
                <div className="jour-evenements">
                  {evenementsJour.slice(0, 3).map(evenement => {
                    const typeInfo = getTypeInfo(evenement.type_evenement);
                    return (
                      <motion.div
                        key={evenement.id}
                        className="evenement-mini"
                        style={{ borderLeftColor: typeInfo.couleur }}
                        onClick={() => onViewEvenement(evenement)}
                        whileHover={{ x: 5 }}
                      >
                        <span className="evenement-heure">{formatHeure(evenement.date_debut)}</span>
                        <span className="evenement-titre">{evenement.titre}</span>
                      </motion.div>
                    );
                  })}
                  {evenementsJour.length > 3 && (
                    <div className="evenement-plus">
                      +{evenementsJour.length - 3} autres
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vue Semaine
  if (vue === 'semaine') {
    const debutSemaine = new Date(date);
    const jourSemaine = date.getDay() || 7;
    debutSemaine.setDate(date.getDate() - (jourSemaine - 1));
    
    // ✅ CORRECTION: Utiliser let au lieu de const
    let joursSemaineArray = [];
    for (let i = 0; i < 7; i++) {
      const jour = new Date(debutSemaine);
      jour.setDate(debutSemaine.getDate() + i);
      joursSemaineArray.push(jour);
    }

    const heures = Array.from({ length: 24 }, (_, i) => i);
    
    const getEvenementsDuJour = (jour: Date) => {
      const jourStr = jour.toISOString().split('T')[0];
      return evenements.filter(e => e.date_debut?.split('T')[0] === jourStr);
    };

    return (
      <div className="calendrier-semaine">
        <div className="semaine-header">
          <div className="heure-colonne"></div>
          {joursSemaineArray.map((jour, idx) => (
            <div key={idx} className="semaine-jour-header">
              <div className="jour-nom">
                {jour.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className="jour-date">{jour.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div className="semaine-corps">
          {heures.map(heure => (
            <div key={heure} className="semaine-ligne">
              <div className="heure-label">
                {heure.toString().padStart(2, '0')}:00
              </div>
              <div className="semaine-cellules">
                {joursSemaineArray.map((jour, idx) => {
                  const jourStr = jour.toISOString().split('T')[0];
                  const evenementsHeure = evenements.filter(e => {
                    const dateEvt = new Date(e.date_debut);
                    return dateEvt.toISOString().split('T')[0] === jourStr &&
                           dateEvt.getHours() === heure;
                  });
                  
                  return (
                    <div key={idx} className="semaine-cellule">
                      {evenementsHeure.map(evenement => {
                        const typeInfo = getTypeInfo(evenement.type_evenement);
                        return (
                          <motion.div
                            key={evenement.id}
                            className="evenement-semaine"
                            style={{ background: `${typeInfo.couleur}20`, borderLeftColor: typeInfo.couleur }}
                            onClick={() => onViewEvenement(evenement)}
                            whileHover={{ scale: 1.02, x: 2 }}
                          >
                            <span className="evenement-titre">{evenement.titre}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vue Jour
  if (vue === 'jour') {
    const jourStr = date.toISOString().split('T')[0];
    const evenementsJour = evenements.filter(e => e.date_debut?.split('T')[0] === jourStr);
    const heures = Array.from({ length: 24 }, (_, i) => i);
    const estAujourdhui = new Date().toDateString() === date.toDateString();

    return (
      <div className="calendrier-jour">
        <div className="jour-header">
          <h2>
            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          {estAujourdhui && <span className="aujourdhui-badge">Aujourd'hui</span>}
        </div>
        
        <div className="jour-corps">
          {heures.map(heure => {
            const evenementsHeure = evenementsJour.filter(e => {
              const dateEvt = new Date(e.date_debut);
              return dateEvt.getHours() === heure;
            });
            
            return (
              <div key={heure} className="jour-ligne">
                <div className="heure-label">
                  {heure.toString().padStart(2, '0')}:00
                </div>
                <div className="jour-cellule">
                  {evenementsHeure.map(evenement => {
                    const typeInfo = getTypeInfo(evenement.type_evenement);
                    const statutInfo = getStatutInfo(evenement.statut);
                    
                    return (
                      <motion.div
                        key={evenement.id}
                        className="evenement-jour"
                        style={{ background: `${typeInfo.couleur}10`, borderLeftColor: typeInfo.couleur }}
                        onClick={() => onViewEvenement(evenement)}
                        whileHover={{ scale: 1.02, x: 5 }}
                      >
                        <div className="evenement-header">
                          <span className="evenement-heure">
                            {formatHeure(evenement.date_debut)}
                            {evenement.date_fin && ` - ${formatHeure(evenement.date_fin)}`}
                          </span>
                          <span className="evenement-type">{typeInfo.label}</span>
                          <span className="evenement-statut" style={{ color: statutInfo.couleur }}>
                            {statutInfo.label}
                          </span>
                        </div>
                        <div className="evenement-titre">{evenement.titre}</div>
                        {evenement.description && (
                          <div className="evenement-description">{evenement.description}</div>
                        )}
                        <div className="evenement-infos">
                          {evenement.lieu && (
                            <span className="evenement-lieu">📍 {evenement.lieu}</span>
                          )}
                          {evenement.locataire_prenom && (
                            <span className="evenement-client">
                              👤 {evenement.locataire_prenom} {evenement.locataire_nom}
                            </span>
                          )}
                          {evenement.bien_nom && (
                            <span className="evenement-bien">🏠 {evenement.bien_nom}</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}