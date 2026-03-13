// lib/auth.ts
import { queryRows, queryInsert } from './database';
import { comparePassword, hashPassword } from './bcrypt';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: string;
  avatar?: string;
  actif: boolean;
}

export interface Session {
  id: number;
  utilisateur_id: number;
  token: string;
  date_expiration: Date;
}

// Générer un token de session
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Créer une session
export async function createSession(utilisateurId: number, userAgent?: string, ipAddress?: string): Promise<string> {
  const token = generateSessionToken();
  const dateExpiration = new Date();
  dateExpiration.setDate(dateExpiration.getDate() + 7); // 7 jours
  
  await queryInsert(
    `INSERT INTO sessions (utilisateur_id, token, user_agent, ip_address, date_expiration)
     VALUES (?, ?, ?, ?, ?)`,
    [utilisateurId, token, userAgent || null, ipAddress || null, dateExpiration]
  );
  
  return token;
}

// Valider une session
export async function validateSession(token: string): Promise<Utilisateur | null> {
  if (!token) return null;
  
  const sessions = await queryRows(
    `SELECT s.*, u.id as user_id, u.email, u.nom, u.prenom, u.telephone, u.role, u.avatar, u.actif
     FROM sessions s
     JOIN utilisateurs u ON s.utilisateur_id = u.id
     WHERE s.token = ? AND s.date_expiration > NOW() AND u.actif = 1`,
    [token]
  ) as any[];
  
  if (sessions.length === 0) return null;
  
  const session = sessions[0];
  return {
    id: session.user_id,
    email: session.email,
    nom: session.nom,
    prenom: session.prenom,
    telephone: session.telephone,
    role: session.role,
    avatar: session.avatar,
    actif: session.actif === 1
  };
}

// Détruire une session
export async function destroySession(token: string): Promise<void> {
  await queryInsert('DELETE FROM sessions WHERE token = ?', [token]);
}

// Authentifier un utilisateur
export async function authenticateUser(email: string, motDePasse: string): Promise<{ success: boolean; utilisateur?: Utilisateur; erreur?: string }> {
  try {
    const users = await queryRows(
      'SELECT id, email, mot_de_passe, nom, prenom, telephone, role, avatar, actif FROM utilisateurs WHERE email = ? AND actif = 1',
      [email]
    ) as any[];
    
    if (users.length === 0) {
      return { success: false, erreur: 'Email ou mot de passe incorrect' };
    }
    
    const user = users[0];
    
    const isValid = await comparePassword(motDePasse, user.mot_de_passe);
    
    if (!isValid) {
      return { success: false, erreur: 'Email ou mot de passe incorrect' };
    }
    
    // Mettre à jour la dernière connexion
    await queryInsert(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?',
      [user.id]
    );
    
    return {
      success: true,
      utilisateur: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        role: user.role,
        avatar: user.avatar,
        actif: user.actif === 1
      }
    };
  } catch (error) {
    console.error('Erreur authentification:', error);
    return { success: false, erreur: 'Erreur lors de l\'authentification' };
  }
}

// Créer un utilisateur
export async function createUser(userData: {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role?: string;
}): Promise<{ success: boolean; utilisateur?: Utilisateur; erreur?: string }> {
  try {
    // Vérifier si l'email existe déjà
    const existing = await queryRows(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [userData.email]
    ) as any[];
    
    if (existing.length > 0) {
      return { success: false, erreur: 'Un utilisateur avec cet email existe déjà' };
    }
    
    const hashedPassword = await hashPassword(userData.motDePasse);
    
    const result = await queryInsert(
      `INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, telephone, role, date_creation)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userData.email,
        hashedPassword,
        userData.nom,
        userData.prenom,
        userData.telephone || null,
        userData.role || 'PROPRIETAIRE'
      ]
    );
    
    if (!result.success) {
      return { success: false, erreur: 'Erreur lors de la création' };
    }
    
    return {
      success: true,
      utilisateur: {
        id: result.insertId,
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        telephone: userData.telephone,
        role: userData.role || 'PROPRIETAIRE',
        actif: true
      }
    };
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    return { success: false, erreur: 'Erreur lors de la création' };
  }
}