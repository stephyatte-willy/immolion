'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import ContratCard from '@/app/components/contrats/ContratCard';
import ContratForm from '@/app/components/contrats/ContratForm';
import { useTheme } from '@/app/providers/ThemeProvider';
import toast from 'react-hot-toast';
import '@/app/components/contrats/contrats.css';

export default function ContratDetail({ params }: { params: Promise<{ id: string }> }) {
  const [contrat, setContrat] = useState<any>(null);
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const router = useRouter();
  const { formatMoney, formatDate } = useTheme();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerEntreprise();
  }, []);

  useEffect(() => {
    if (id) {
      chargerContrat();
    }
  }, [id]);

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) setEntreprise(data.entreprise);
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
    }
  };

  const chargerContrat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contrats/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setContrat(data.contrat);
      } else {
        toast.error('Contrat non trouvé');
        router.push('/contrats');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !contrat) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du contrat...</p>
      </div>
    );
  }

  return (
    <div className="contrats-container">
      <Sidebar />
      
      <div className="contrats-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Détail du contrat"
          sousTitre={`Contrat n°${contrat.numero_contrat}`}
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="contrats-content">
          <div className="detail-header">
            <button 
              className="back-button"
              onClick={() => router.back()}
            >
              ← Retour
            </button>
            <button 
              className="edit-button"
              onClick={() => setShowEditForm(true)}
            >
              ✏️ Modifier
            </button>
          </div>

          <div className="contrat-detail-grid">
            <ContratCard
              contrat={contrat}
              onView={() => {}}
              onEdit={() => setShowEditForm(true)}
              onDelete={async (id) => {
                if (confirm('Supprimer ce contrat ?')) {
                  try {
                    const response = await fetch(`/api/contrats/${id}`, {
                      method: 'DELETE'
                    });
                    const data = await response.json();
                    if (data.success) {
                      toast.success('Contrat supprimé');
                      router.push('/contrats');
                    }
                  } catch (error) {
                    toast.error('Erreur lors de la suppression');
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Modale d'édition avec AnimatePresence */}
      <AnimatePresence>
        {showEditForm && (
          <ContratForm
            contrat={contrat}
            onClose={() => setShowEditForm(false)}
            onSuccess={() => {
              setShowEditForm(false);
              chargerContrat();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}  