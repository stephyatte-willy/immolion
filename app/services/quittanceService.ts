import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  WidthType,
  Table,
  TableRow,
  TableCell,
  Footer,
  Header,
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuittanceData {
  numero_quittance: string;
  mois_concerne: string;
  date_emission: string;
  paiement: {
    reference: string;
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    penalite?: number;
  };
  contrat: {
    numero: string;
    date_debut: string;
    date_fin?: string;
  };
  locataire: {
    nom: string;
    prenom: string;
    telephone: string;
  };
  bien: {
    nom: string;
    adresse: string;
    commune: string;
    ville: string;
    quartier?: string;
    loyer_mensuel: number;
  };
  entreprise: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    site_web?: string;
  };
}

class QuittanceService {
  
  /**
   * Génère une quittance de loyer au format Word
   */
  async genererQuittance(data: QuittanceData): Promise<void> {
    
    // Formatage des montants
    const montantLettre = this.nombreEnLettres(data.paiement.montant);
    const montantTotal = data.paiement.montant + (data.paiement.penalite || 0);
    
    // Construction de l'adresse complète du bien
    const adresseComplete = [
      data.bien.adresse,
      data.bien.quartier ? `Quartier ${data.bien.quartier}` : null,
      data.bien.commune,
      data.bien.ville
    ].filter(Boolean).join(', ');

    // Création du document
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
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "QUITTANCE DE LOYER",
                    bold: true,
                    size: 48,
                    font: "Times New Roman",
                    color: "D4AF37",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Document émis le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`,
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Cette quittance annule tout précédent reçu. À conserver pendant 3 ans.",
                    size: 16,
                    italics: true,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // En-tête avec informations de l'entreprise
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
                size: 24,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Tél: ${data.entreprise.telephone} | Email: ${data.entreprise.email}`,
                size: 22,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Numéro de quittance
          new Paragraph({
            children: [
              new TextRun({
                text: `N° QUITTANCE : ${data.numero_quittance}`,
                bold: true,
                size: 28,
                font: "Times New Roman",
                color: "D4AF37",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Corps de la quittance
          new Paragraph({
            children: [
              new TextRun({
                text: "Je soussigné, ",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `${data.entreprise.nom}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: ", propriétaire du bien situé ",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `à ${adresseComplete},`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "reconnaît avoir reçu de ",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `M. ${data.locataire.prenom} ${data.locataire.nom}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: ", locataire, la somme de :",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Montant en toutes lettres
          new Paragraph({
            children: [
              new TextRun({
                text: montantLettre.toUpperCase(),
                bold: true,
                size: 28,
                font: "Times New Roman",
                color: "D4AF37",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Soit ${data.paiement.montant.toLocaleString()} FCFA`,
                bold: true,
                size: 28,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Tableau récapitulatif
          new Paragraph({
            children: [
              new TextRun({
                text: "DÉTAIL DU PAIEMENT",
                bold: true,
                size: 26,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
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
                    shading: { fill: "F4E5B9" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Détails", bold: true })] })],
                    shading: { fill: "F4E5B9" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Montant (FCFA)", bold: true })] })],
                    shading: { fill: "F4E5B9" },
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Loyer mensuel" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `Mois de ${this.getMoisLabel(data.mois_concerne)}` })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.paiement.montant.toLocaleString() })] })],
                  }),
                ],
              }),
              ...(data.paiement.penalite ? [new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Pénalité de retard" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Application contrat" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.paiement.penalite.toLocaleString() })] })],
                  }),
                ],
              })] : []),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })] })],
                    shading: { fill: "F4E5B9" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "", bold: true })] })],
                    shading: { fill: "F4E5B9" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ 
                        text: montantTotal.toLocaleString(), 
                        bold: true,
                        color: "D4AF37",
                      })] 
                    })],
                    shading: { fill: "F4E5B9" },
                  }),
                ],
              }),
            ],
          }),

          // Informations complémentaires
          new Paragraph({
            children: [
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "Mode de paiement : ",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: this.getModePaiementLabel(data.paiement.mode_paiement),
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Référence : ",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: data.paiement.reference || "Non fournie",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Date de paiement : ",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: format(new Date(data.paiement.date_paiement), 'dd MMMM yyyy', { locale: fr }),
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Contrat n° : ",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: data.contrat.numero,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Informations du locataire
          new Paragraph({
            children: [
              new TextRun({
                text: "Locataire : ",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `${data.locataire.prenom} ${data.locataire.nom}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Tél locataire : ",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: data.locataire.telephone,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Mentions légales
          new Paragraph({
            children: [
              new TextRun({
                text: "MENTIONS LÉGALES",
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Cette quittance est délivrée pour servir et valoir ce que de droit. " +
                      "Elle est à conserver pendant toute la durée de la location et jusqu'à " +
                      "trois ans après la fin du bail. En cas de perte, seule une attestation " +
                      "de paiement pourra être délivrée.",
                size: 20,
                font: "Times New Roman",
                italics: true,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Signatures
          new Paragraph({
            children: [
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "Fait à Abidjan, le ",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: format(new Date(), 'dd MMMM yyyy', { locale: fr }),
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "Signature du propriétaire",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\t\t\t\t\t\t\t\t", break: 1 }),
              new TextRun({
                text: "Signature du locataire",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.BOTH,
            spacing: { before: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "(Précédé de la mention 'Reçu la somme ci-dessus')",
                size: 18,
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
    saveAs(blob, `Quittance_${data.numero_quittance}_${data.locataire.nom}.docx`);
  }

  /**
   * Convertit un nombre en lettres
   */
  private nombreEnLettres(nombre: number): string {
    if (nombre === 0) return 'zéro franc CFA';
    
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
    
    return lettres.trim() + ' franc CFA';
  }

  /**
   * Obtient le libellé du mois
   */
  private getMoisLabel(moisConcerne: string): string {
    if (!moisConcerne) return 'Non spécifié';
    const [annee, mois] = moisConcerne.split('-');
    const moisNum = parseInt(mois);
    const moisList = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${moisList[moisNum - 1]} ${annee}`;
  }

  /**
   * Obtient le libellé du mode de paiement
   */
  private getModePaiementLabel(mode: string): string {
    const modes: Record<string, string> = {
      'ESPECES': 'Espèces',
      'CHEQUE': 'Chèque',
      'VIREMENT': 'Virement bancaire',
      'MOBILE_MONEY': 'Mobile Money (Orange Money, MTN)',
      'WAVE': 'Wave',
      'CARTE': 'Carte bancaire'
    };
    return modes[mode] || mode;
  }
}

export const quittanceService = new QuittanceService();