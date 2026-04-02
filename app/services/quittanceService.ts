import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, Header } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuittanceData {
  type: 'LOCATION' | 'VENTE';
  numero_document: string;
  date_emission: string;
  paiement: {
    reference: string;
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    penalite?: number;
    type_versement?: 'ACOMPTE' | 'VERSEMENT' | 'SOLDE';
    versement_numero?: number;
  };
  contrat: {
    numero: string;
    date_debut: string;
    date_fin?: string;
    type: string;
    loyer_mensuel?: number;
    prix_vente?: number;
  };
  client: {
    nom: string;
    prenom: string;
    telephone: string;
    type: 'locataire' | 'acheteur';
  };
  bien: {
    nom: string;
    adresse: string;
    commune: string;
    ville: string;
    quartier?: string;
    loyer_mensuel?: number;
    prix_vente?: number;
  };
  entreprise: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    site_web?: string;
  };
  echeancier?: {
    total_vente: number;
    deja_verse: number;
    reste: number;
    versement_numero: number;
  };
}

class QuittanceService {
  
  /**
   * Convertit un nombre en lettres
   */
  private nombreEnLettres(nombre: number): string {
    if (nombre === 0) return 'zéro';
    if (nombre === null || nombre === undefined || isNaN(nombre)) return 'zéro';
    
    const unite = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const dix = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const dizaine = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    let lettres = '';
    let montant = Math.floor(nombre);
    
    if (montant >= 1000000) {
      const millions = Math.floor(montant / 1000000);
      lettres += this.nombreEnLettres(millions) + ' million' + (millions > 1 ? 's' : '') + ' ';
      montant %= 1000000;
    }
    
    if (montant >= 1000) {
      const milliers = Math.floor(montant / 1000);
      if (milliers > 1) lettres += this.nombreEnLettres(milliers) + ' ';
      lettres += 'mille ';
      montant %= 1000;
    }
    
    if (montant >= 100) {
      const centaines = Math.floor(montant / 100);
      if (centaines > 1) lettres += unite[centaines] + ' ';
      lettres += 'cent' + (centaines > 1 && montant % 100 === 0 ? 's' : '') + ' ';
      montant %= 100;
    }
    
    if (montant >= 20) {
      const d = Math.floor(montant / 10);
      lettres += dizaine[d];
      if (d === 7 || d === 9) {
        lettres += '-' + dix[montant % 10];
      } else {
        if (montant % 10 !== 0) {
          lettres += '-' + unite[montant % 10];
        }
      }
    } else if (montant >= 10) {
      lettres += dix[montant - 10];
    } else if (montant > 0) {
      lettres += unite[montant];
    }
    
    return lettres.trim();
  }

  /**
   * Génère une quittance de loyer ou un reçu de versement
   */
  async genererQuittance(data: QuittanceData): Promise<void> {
    const isVente = data.type === 'VENTE';
    const datePaiement = format(new Date(data.paiement.date_paiement), 'dd MMMM yyyy', { locale: fr });
    const dateEmission = format(new Date(data.date_emission), 'dd MMMM yyyy', { locale: fr });
    const montant = data.paiement.montant;
    const penalite = data.paiement.penalite || 0;
    const montantTotal = montant + penalite;
    const montantEnLettres = this.nombreEnLettres(montantTotal);
    
    // Titre du document
    const titre = isVente ? "REÇU DE VERSEMENT" : "QUITTANCE DE LOYER";
    const sousTitre = isVente ? "Pour achat immobilier" : "Pour location immobilière";
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // En-tête avec logo et coordonnées
          new Paragraph({
            children: [
              new TextRun({
                text: data.entreprise.nom.toUpperCase(),
                bold: true,
                size: 36,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: data.entreprise.adresse,
                size: 20,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Tél: ${data.entreprise.telephone} | Email: ${data.entreprise.email}`,
                size: 20,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // Titre du document
          new Paragraph({
            children: [
              new TextRun({
                text: titre,
                bold: true,
                size: 44,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: sousTitre,
                size: 24,
                font: "Times New Roman",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // Numéro du document
          new Paragraph({
            children: [
              new TextRun({
                text: `N° ${data.numero_document}`,
                bold: true,
                size: 28,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // Informations du client
          new Paragraph({
            children: [
              new TextRun({
                text: isVente ? "ACQUÉREUR :" : "LOCATAIRE :",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.client.prenom} ${data.client.nom.toUpperCase()}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Tél: ${data.client.telephone}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Informations du bien
          new Paragraph({
            children: [
              new TextRun({
                text: "BIEN CONCERNÉ :",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: data.bien.nom,
                size: 24,
                font: "Times New Roman",
                bold: true,
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `${data.bien.adresse}, ${data.bien.quartier ? `Quartier ${data.bien.quartier}, ` : ''}${data.bien.commune}, ${data.bien.ville}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Informations du contrat
          new Paragraph({
            children: [
              new TextRun({
                text: "CONTRAT :",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `N° ${data.contrat.numero}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Date de début: ${format(new Date(data.contrat.date_debut), 'dd MMMM yyyy', { locale: fr })}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Détails du paiement - Tableau
          new Paragraph({
            children: [
              new TextRun({
                text: "DÉTAIL DU PAIEMENT",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Désignation", bold: true })] })],
                    verticalAlign: "center",
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Montant (FCFA)", bold: true })] })],
                    verticalAlign: "center",
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: isVente ? "Versement" : "Loyer" }) ] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: montant.toLocaleString() }) ] })],
                  }),
                ],
              }),
              ...(penalite > 0 ? [new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Pénalité de retard" }) ] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: penalite.toLocaleString() }) ] })],
                  }),
                ],
              })] : []),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true }) ] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: montantTotal.toLocaleString(), bold: true }) ] })],
                  }),
                ],
              }),
            ],
          }),
          
          // Montant en lettres
          new Paragraph({
            children: [
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Arrêté la présente quittance à la somme de : ${montantEnLettres} Francs CFA`,
                size: 24,
                font: "Times New Roman",
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Informations complémentaires
          new Paragraph({
            children: [
              new TextRun({
                text: `Mode de paiement : ${data.paiement.mode_paiement}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Référence : ${data.paiement.reference || 'Non spécifiée'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Date de paiement : ${datePaiement}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Échéancier pour les ventes
          ...(isVente && data.echeancier ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "SUIVI DES VERSEMENTS",
                  bold: true,
                  size: 24,
                  font: "Times New Roman",
                }),
              ],
              spacing: { after: 100 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Total de la vente", bold: true }) ] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: data.echeancier.total_vente.toLocaleString() }) ] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Déjà versé", bold: true }) ] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: data.echeancier.deja_verse.toLocaleString() }) ] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Reste à payer", bold: true }) ] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: data.echeancier.reste.toLocaleString(), bold: true }) ] })],
                    }),
                  ],
                }),
              ],
            }),
          ] : []),
          
          // Signature
          new Paragraph({
            children: [
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Fait à Abidjan, le ${dateEmission}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "Signature et cachet",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "(Précédé de la mention 'Lu et approuvé')",
                size: 20,
                font: "Times New Roman",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
          }),
        ],
      }],
    });
    
    // Générer et télécharger le document
    const blob = await Packer.toBlob(doc);
    const fileName = isVente 
      ? `RECU_VERSEMENT_${data.numero_document}_${data.client.nom}_${data.client.prenom}.docx`
      : `QUITTANCE_${data.numero_document}_${data.client.nom}_${data.client.prenom}.docx`;
    
    saveAs(blob, fileName);
  }
}

export const quittanceService = new QuittanceService();