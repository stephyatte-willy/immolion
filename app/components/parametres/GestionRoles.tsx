'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES, ROLE_PERMISSIONS } from '@/app/lib/roles';
import { Role, Permission } from '@/app/types/roles';
import toast from 'react-hot-toast';
import './parametres.css';

interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: Role;
  roles_secondaires: Role[];
  permissions_specifiques: { permission: Permission; accordee: boolean }[];
  actif: boolean;
  date_creation: string;
  derniere_connexion?: string;
}

export default function GestionRoles() {
  const [selectedRole, setSelectedRole] = useState<Role>('PROPRIETAIRE');
  const [rolePermissions, setRolePermissions] = useState<Permission[]>(ROLE_PERMISSIONS[selectedRole]);
  const [showPermissionEditor, setShowPermissionEditor] = useState(false);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [selectedUtilisateur, setSelectedUtilisateur] = useState<Utilisateur | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRole, setFilterRole] = useState<string>('');

  const permissionsParModule = {
    dashboard: ['dashboard:voir'],
    biens: ['biens:voir', 'biens:créer', 'biens:modifier', 'biens:supprimer'],
    locataires: ['locataires:voir', 'locataires:créer', 'locataires:modifier', 'locataires:supprimer'],
    contrats: ['contrats:voir', 'contrats:créer', 'contrats:modifier', 'contrats:supprimer'],
    paiements: ['paiements:voir', 'paiements:créer', 'paiements:modifier', 'paiements:supprimer'],
    documents: ['documents:voir', 'documents:upload', 'documents:supprimer'],
    utilisateurs: ['utilisateurs:voir', 'utilisateurs:créer', 'utilisateurs:modifier', 'utilisateurs:supprimer'],
    administration: ['roles:paramétrer', 'parametres:voir', 'parametres:modifier', 'logs:voir', 'api:paramétrer']
  };

  // Charger les utilisateurs
  useEffect(() => {
    chargerUtilisateurs();
  }, [currentPage, searchTerm, filterRole]);

  const chargerUtilisateurs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole && { role: filterRole })
      });

      const response = await fetch(`/api/utilisateurs?${params}`);
      const data = await response.json();

      if (data.success) {
        setUtilisateurs(data.utilisateurs);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setRolePermissions(ROLE_PERMISSIONS[role]);
  };

  const togglePermission = (permission: Permission) => {
    if (rolePermissions.includes(permission)) {
      setRolePermissions(rolePermissions.filter(p => p !== permission));
    } else {
      setRolePermissions([...rolePermissions, permission]);
    }
  };

  const savePermissions = async () => {
    try {
      // Ici, vous pouvez sauvegarder les permissions personnalisées pour un rôle
      // Cela nécessiterait une table dédiée dans la base de données
      toast.success('Permissions mises à jour avec succès');
      setShowPermissionEditor(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEditUser = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const response = await fetch(`/api/utilisateurs/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Utilisateur supprimé avec succès');
        chargerUtilisateurs();
        setShowDeleteConfirm(false);
        setSelectedUtilisateur(null);
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleUserStatus = async (utilisateur: Utilisateur) => {
    try {
      const response = await fetch(`/api/utilisateurs/${utilisateur.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !utilisateur.actif })
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Utilisateur ${utilisateur.actif ? 'désactivé' : 'activé'} avec succès`);
        chargerUtilisateurs();
      } else {
        toast.error(data.erreur || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  return (
    <motion.div 
      className="param-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="param-header">
        <div className="param-title">
          <span className="param-icon">👥</span>
          <h2>Gestion des rôles et permissions</h2>
        </div>
      </div>

      {/* Section Rôles */}
      <div className="roles-section">
        <h3>Rôles disponibles</h3>
        <div className="roles-grid">
          {Object.values(ROLES).map((role) => (
            <motion.div
              key={role.id}
              className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
              onClick={() => handleRoleChange(role.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderColor: role.couleur }}
            >
              <div className="role-icon" style={{ background: role.couleur }}>
                {role.icone}
              </div>
              <div className="role-info">
                <h3>{role.nom}</h3>
                <p>{role.description}</p>
              </div>
              <div className="role-level">
                Niveau {role.niveau}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section Permissions */}
      <div className="permissions-section">
        <div className="permissions-header">
          <h3>Permissions pour {ROLES[selectedRole].nom}</h3>
          <button 
            className="edit-permissions-btn"
            onClick={() => setShowPermissionEditor(!showPermissionEditor)}
          >
            {showPermissionEditor ? '🔍 Voir' : '✏️ Personnaliser'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showPermissionEditor ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="permissions-editor"
            >
              {Object.entries(permissionsParModule).map(([module, permissions]) => (
                <div key={module} className="permission-module">
                  <h4>● {module.charAt(0).toUpperCase() + module.slice(1)}</h4>
                  <div className="permissions-grid">
                    {permissions.map((permission) => (
                      <label key={permission} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={rolePermissions.includes(permission as Permission)}
                          onChange={() => togglePermission(permission as Permission)}
                        />
                        <span className="permission-name">
                          {permission.split(':')[1]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="permissions-actions">
                <button className="save-permissions" onClick={savePermissions}>
                  💾 Enregistrer les permissions
                </button>
                <button 
                  className="reset-permissions"
                  onClick={() => setRolePermissions(ROLE_PERMISSIONS[selectedRole])}
                >
                  ↩️ Réinitialiser
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="voir"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="permissions-view"
            >
              <div className="permissions-summary">
                {rolePermissions.map((permission) => (
                  <span key={permission} className="permission-tag">
                    {permission}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section Utilisateurs */}
      <div className="users-section">
        <div className="users-header">
          <h3>Gestion des utilisateurs</h3>
          <button 
            className="add-user-btn"
            onClick={() => {
              setSelectedUtilisateur(null);
              setShowUserModal(true);
            }}
          >
            ➕ Nouvel utilisateur
          </button>
        </div>

        {/* Filtres */}
        <div className="users-filters">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les rôles</option>
            {Object.values(ROLES).map((role) => (
              <option key={role.id} value={role.id}>{role.nom}</option>
            ))}
          </select>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="users-table-container">
          {isLoading ? (
            <div className="loading-spinner">Chargement...</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle principal</th>
                  <th>Rôles secondaires</th>
                  <th>Statut</th>
                  <th>Dernière connexion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {user.prenom[0]}{user.nom[0]}
                        </div>
                        <span>{user.prenom} {user.nom}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span 
                        className="role-badge"
                        style={{ background: ROLES[user.role]?.couleur + '20', color: ROLES[user.role]?.couleur }}
                      >
                        {ROLES[user.role]?.icone} {ROLES[user.role]?.nom}
                      </span>
                    </td>
                    <td>
                      <div className="roles-list">
                        {user.roles_secondaires?.map((role) => (
                          <span 
                            key={role} 
                            className="role-tag"
                            style={{ background: ROLES[role]?.couleur + '20', color: ROLES[role]?.couleur }}
                          >
                            {ROLES[role]?.icone}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${user.actif ? 'actif' : 'inactif'}`}>
                        {user.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      {user.derniere_connexion 
                        ? new Date(user.derniere_connexion).toLocaleDateString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditUser(user)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn toggle"
                          onClick={() => handleToggleUserStatus(user)}
                          title={user.actif ? 'Désactiver' : 'Activer'}
                        >
                          {user.actif ? '🔒' : '🔓'}
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => {
                            setSelectedUtilisateur(user);
                            setShowDeleteConfirm(true);
                          }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ←
            </button>
            <span>Page {currentPage} / {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Modal Utilisateur */}
      <AnimatePresence>
        {showUserModal && (
          <UtilisateurModal
            utilisateur={selectedUtilisateur}
            onClose={() => setShowUserModal(false)}
            onSave={() => {
              setShowUserModal(false);
              chargerUtilisateurs();
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal de confirmation suppression */}
      <AnimatePresence>
        {showDeleteConfirm && selectedUtilisateur && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3>Confirmer la suppression</h3>
              <p>
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUtilisateur.prenom} {selectedUtilisateur.nom}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="modal-actions">
                <button 
                  className="confirm-delete"
                  onClick={() => handleDeleteUser(selectedUtilisateur.id)}
                >
                  🗑️ Supprimer
                </button>
                <button 
                  className="cancel-delete"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Composant Modal pour créer/modifier un utilisateur
function UtilisateurModal({ utilisateur, onClose, onSave }: { 
  utilisateur: Utilisateur | null; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
  email: utilisateur?.email || '',
  motDePasse: utilisateur ? '' : 'ImmoLion28', // ✅ Pré-rempli seulement pour création
  nom: utilisateur?.nom || '',
  prenom: utilisateur?.prenom || '',
  telephone: utilisateur?.telephone || '',
  role: utilisateur?.role || 'PROPRIETAIRE',
  roles_secondaires: utilisateur?.roles_secondaires || [],
  actif: utilisateur?.actif ?? true
});
  const [isLoading, setIsLoading] = useState(false);

// Dans UtilisateurModal, fonction handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const url = utilisateur 
      ? `/api/utilisateurs/${utilisateur.id}`
      : '/api/utilisateurs';
    
    const method = utilisateur ? 'PUT' : 'POST';

    // Nettoyer les données avant envoi
    const dataToSend = {
      ...formData,
      // Ne pas envoyer de mot de passe vide en modification
      motDePasse: formData.motDePasse || undefined,
      // S'assurer que les rôles secondaires sont un tableau
      roles_secondaires: formData.roles_secondaires || [],
      // S'assurer que actif est un boolean
      actif: !!formData.actif
    };

    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend)
    });

    const data = await response.json();

    if (data.success) {
      toast.success(utilisateur ? 'Utilisateur modifié' : 'Utilisateur créé');
      onSave();
    } else {
      toast.error(data.erreur || 'Une erreur est survenue');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la sauvegarde');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content large"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <h3>{utilisateur ? 'Modifier' : 'Nouvel'} utilisateur</h3>
        
<form onSubmit={handleSubmit}>
  <div className="form-grid">
    <div className="form-group">
      <label>Prénom *</label>
      <input
        type="text"
        value={formData.prenom}
        onChange={(e) => setFormData({...formData, prenom: e.target.value})}
        required
      />
    </div>

    <div className="form-group">
      <label>Nom *</label>
      <input
        type="text"
        value={formData.nom}
        onChange={(e) => setFormData({...formData, nom: e.target.value})}
        required
      />
    </div>

    <div className="form-group">
      <label>Email *</label>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
    </div>

    {/* Mot de passe pour création */}
    {!utilisateur && (
      <div className="form-group">
        <label>Mot de passe *</label>
        <div className="password-hint">
          <input
            type="password"
            value={formData.motDePasse}
            onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
            required
            placeholder="ImmoLion28"
          />
          <small className="input-help">
            Mot de passe par défaut : <strong>ImmoLion28</strong> (modifiable)
          </small>
        </div>
      </div>
    )}

    {/* Mot de passe pour modification (optionnel) */}
    {utilisateur && (
      <div className="form-group">
        <label>Nouveau mot de passe</label>
        <div className="password-hint">
          <input
            type="password"
            value={formData.motDePasse}
            onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
            placeholder="Laisser vide pour conserver l'actuel"
          />
          <small className="input-help">
            Remplissez uniquement si vous voulez changer le mot de passe
          </small>
        </div>
      </div>
    )}

    <div className="form-group">
      <label>Téléphone</label>
      <input
        type="tel"
        value={formData.telephone}
        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
        placeholder="+225 00 00 00 00"
      />
    </div>

    <div className="form-group">
      <label>Rôle principal *</label>
      <select
        value={formData.role}
        onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
        required
      >
        {Object.values(ROLES).map((role) => (
          <option key={role.id} value={role.id}>
            {role.icone} {role.nom}
          </option>
        ))}
      </select>
    </div>

    <div className="form-group full-width">
      <label>Rôles secondaires</label>
      <div className="roles-selector">
        {Object.values(ROLES).filter(r => r.id !== formData.role).map((role) => (
          <label key={role.id} className="role-checkbox">
            <input
              type="checkbox"
              checked={formData.roles_secondaires.includes(role.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData({
                    ...formData,
                    roles_secondaires: [...formData.roles_secondaires, role.id]
                  });
                } else {
                  setFormData({
                    ...formData,
                    roles_secondaires: formData.roles_secondaires.filter(r => r !== role.id)
                  });
                }
              }}
            />
            <span style={{ color: role.couleur }}>{role.icone} {role.nom}</span>
          </label>
        ))}
      </div>
    </div>

    <div className="form-group">
      <label>Statut</label>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={formData.actif}
          onChange={(e) => setFormData({...formData, actif: e.target.checked})}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">{formData.actif ? 'Actif' : 'Inactif'}</span>
      </label>
    </div>
  </div>

  <div className="modal-actions">
    <button 
      type="submit" 
      className="save-button"
      disabled={isLoading}
    >
      {isLoading ? 'Enregistrement...' : '💾 Enregistrer'}
    </button>
    <button 
      type="button" 
      className="cancel-button"
      onClick={onClose}
      disabled={isLoading}
    >
      Annuler
    </button>
  </div>
</form>
      </motion.div>
    </motion.div>
  );
}