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

// Interface unifiée pour les deux types
interface DocumentPaiementData {
  // Informations communes
  numero_document: string;
  date_emission: string;
  type: 'LOCATION' | 'VENTE';
  
  // Paiement
  paiement: {
    reference: string;
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    penalite?: number;
    type_versement?: 'ACOMPTE' | 'VERSEMENT' | 'SOLDE';
    versement_numero?: number;
  };
  
  // Contrat
  contrat: {
    numero: string;
    date_debut: string;
    date_fin?: string;
    type: string;
    prix_vente?: number;
    loyer_mensuel?: number;
  };
  
  // Client
  client: {
    nom: string;
    prenom: string;
    telephone: string;
    type: 'locataire' | 'acheteur';
  };
  
  // Bien
  bien: {
    nom: string;
    adresse: string;
    commune: string;
    ville: string;
    quartier?: string;
    loyer_mensuel?: number;
    prix_vente?: number;
  };
  
  // Entreprise
  entreprise: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    site_web?: string;
  };

  // Pour les ventes, suivi de l'échéancier
  echeancier?: {
    total_vente: number;
    deja_verse: number;
    reste: number;
    versement_numero: number;
  };
}

class DocumentPaiementService {
  
  /**
   * Génère un document de paiement (quittance de loyer ou reçu de vente)
   */
  async genererDocument(data: DocumentPaiementData): Promise<void> {
    
    const montantLettre = this.nombreEnLettres(data.paiement.montant);
    const montantTotal = data.paiement.montant + (data.paiement.penalite || 0);
    const isVente = data.type === 'VENTE';
    
    // Construction de l'adresse complète du bien
    const adresseComplete = [
      data.bien.adresse,
      data.bien.quartier ? `Quartier ${data.bien.quartier}` : null,
      data.bien.commune,
      data.bien.ville
    ].filter(Boolean).join(', ');

    // Titre du document
    const titre = isVente 
      ? (data.paiement.type_versement === 'ACOMPTE' ? "REÇU D'ACOMPTE" 
        : data.paiement.type_versement === 'SOLDE' ? "REÇU DE SOLDE" 
        : "REÇU DE VERSEMENT")
      : "QUITTANCE DE LOYER";

    // Type de client
    const typeClient = isVente ? 'acheteur' : 'locataire';

    // ✅ Formatage correct des nombres
    const formaterMontant = (montant: number): string => {
  return montant.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

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
                    text: titre,
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
                    text: `Document émis le ${format(new Date(data.date_emission), 'dd MMMM yyyy', { locale: fr })}`,
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
                    text: isVente 
                      ? "Ce reçu annule tout précédent. À conserver jusqu'à la finalisation de la vente."
                      : "Cette quittance annule tout précédent reçu. À conserver pendant 3 ans.",
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
          // En-tête entreprise
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

          // Numéro de document
          new Paragraph({
            children: [
              new TextRun({
                text: `N° ${isVente ? 'REÇU' : 'QUITTANCE'} : ${data.numero_document}`,
                bold: true,
                size: 28,
                font: "Times New Roman",
                color: "D4AF37",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Corps du document
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
                text: `, ${isVente ? 'vendeur' : 'propriétaire'} du bien situé `,
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
                text: `reconnaît avoir reçu de `,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `M. ${data.client.prenom} ${data.client.nom}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `, ${typeClient}, la somme de :`,
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
      text: `Soit ${formaterMontant(data.paiement.montant)} FCFA`, // ✅ 600 000 FCFA
      bold: true,
      size: 28,
      font: "Times New Roman",
    }),
  ],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
}),

          // Informations sur le versement (pour les ventes)
          ...(isVente && data.paiement.versement_numero ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Versement n° ${data.paiement.versement_numero}`,
                  bold: true,
                  size: 24,
                  font: "Times New Roman",
                  color: "D4AF37",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            })
          ] : []),

          // Tableau récapitulatif
          new Paragraph({
            children: [
              new TextRun({
                text: isVente ? "DÉTAIL DU VERSEMENT" : "DÉTAIL DU PAIEMENT",
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
                    children: [new Paragraph({ children: [new TextRun({ text: isVente ? "Versement" : "Loyer mensuel" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: isVente 
                        ? `${data.paiement.type_versement || 'Versement'} n°${data.paiement.versement_numero || 1}`
                        : `Mois de ${this.getMoisLabel(data.paiement.date_paiement)}` 
                    })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: formaterMontant(data.paiement.montant) // ✅ Plus de .00
                    })] })],
                  }),
                ],
              }),
              ...(data.paiement.penalite && data.paiement.penalite > 0 ? [new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Pénalité de retard" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Application contrat" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: formaterMontant(data.paiement.penalite) })] })],
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
                        text: formaterMontant(montantTotal), 
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

          // Suivi de l'échéancier pour les ventes
          ...(isVente && data.echeancier ? [
            new Paragraph({
              children: [
                new TextRun({ text: "\n", break: 1 }),
                new TextRun({
                  text: "SUIVI DE L'ÉCHÉANCIER",
                  bold: true,
                  size: 24,
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
                      children: [new Paragraph({ children: [new TextRun({ text: "Prix total", bold: true })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Déjà versé", bold: true })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Reste à payer", bold: true })] })],
                    }),
                  ],
                }),
                new TableRow({
  children: [
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ 
        text: formaterMontant(data.echeancier.total_vente) // ✅ 120 000 000 au lieu de 120000000.00
      })] })],
    }),
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ 
        text: formaterMontant(data.echeancier.deja_verse) // ✅ 600 000 au lieu de 0600000.00
      })] })],
    }),
    new TableCell({
      children: [new Paragraph({ 
        children: [new TextRun({ 
          text: formaterMontant(data.echeancier.reste), // ✅ 119 400 000
          bold: true,
          color: data.echeancier.reste > 0 ? "EF4444" : "10B981"
        })] 
      })],
    }),
  ],
}),
              ],
            }),
          ] : []),

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

          // Informations du client
          new Paragraph({
            children: [
              new TextRun({
                text: `${isVente ? 'Acheteur' : 'Locataire'} : `,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `${data.client.prenom} ${data.client.nom}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Tél ${isVente ? 'acheteur' : 'locataire'} : `,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({
                text: data.client.telephone,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Mentions légales adaptées
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
                text: isVente
                  ? "Ce reçu fait foi de versement dans le cadre de l'acquisition immobilière. "
                    + "Il est à conserver jusqu'à la signature de l'acte définitif de vente."
                  : "Cette quittance est délivrée pour servir et valoir ce que de droit. "
                    + "Elle est à conserver pendant toute la durée de la location et jusqu'à "
                    + "trois ans après la fin du bail.",
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
                text: format(new Date(data.date_emission), 'dd MMMM yyyy', { locale: fr }),
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
                text: `Signature du ${isVente ? 'vendeur' : 'propriétaire'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\t\t\t\t\t\t\t\t", break: 1 }),
              new TextRun({
                text: `Signature de l'${isVente ? 'acheteur' : 'locataire'}`,
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
    const nomFichier = isVente
      ? `Reçu_${data.paiement.type_versement || 'Versement'}_${data.numero_document}_${data.client.nom}.docx`
      : `Quittance_${data.numero_document}_${data.client.nom}.docx`;
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, nomFichier);
  }

  /**
   * Convertit un nombre en lettres
   */
private nombreEnLettres(nombre: number): string {
  if (nombre === 0) return 'ZÉRO FRANC CFA';
  
  const unite = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  const dix = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  const dizaine = ['', '', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];
  
  // Fonction interne pour convertir les nombres < 1000
  const convertirCentaines = (n: number): string => {
    if (n === 0) return '';
    
    let resultat = '';
    
    // Centaines
    if (n >= 100) {
      const centaines = Math.floor(n / 100);
      if (centaines === 1) {
        resultat += 'CENT ';
      } else {
        resultat += unite[centaines] + ' CENT ';
      }
      n %= 100;
    }
    
    // Dizaines et unités
    if (n >= 20) {
      const d = Math.floor(n / 10);
      resultat += dizaine[d];
      if (d === 7 || d === 9) {
        resultat += '-' + dix[n % 10];
      } else if (n % 10 !== 0) {
        resultat += '-' + unite[n % 10];
      } else if (d === 8 && n % 10 === 0) {
        resultat += 'S'; // Quatre-vingts
      }
    } else if (n >= 10) {
      resultat += dix[n - 10];
    } else if (n > 0) {
      resultat += unite[n];
    }
    
    return resultat.trim();
  };

  let lettres = '';
  let montant = Math.floor(nombre);
  
  // Milliards (au cas où)
  if (montant >= 1000000000) {
    const milliards = Math.floor(montant / 1000000000);
    lettres += convertirCentaines(milliards) + ' MILLIARD' + (milliards > 1 ? 'S ' : ' ');
    montant %= 1000000000;
  }
  
  // Millions
  if (montant >= 1000000) {
    const millions = Math.floor(montant / 1000000);
    if (millions === 1) {
      lettres += 'UN MILLION ';
    } else {
      lettres += convertirCentaines(millions) + ' MILLIONS ';
    }
    montant %= 1000000;
  }
  
  // Milliers - CORRECTION IMPORTANTE
  if (montant >= 1000) {
    const milliers = Math.floor(montant / 1000);
    if (milliers === 1) {
      lettres += 'MILLE ';
    } else {
      // Pour 600 000, milliers = 600
      // convertirCentaines(600) donne "SIX CENT"
      lettres += convertirCentaines(milliers) + ' MILLE ';
    }
    montant %= 1000;
  }
  
  // Le reste (moins de 1000)
  if (montant > 0) {
    lettres += convertirCentaines(montant);
  }
  
  // Nettoyer et ajouter "FRANCS CFA"
  return lettres.trim().replace(/\s+/g, ' ') + ' FRANCS CFA';
}

  /**
   * Obtient le libellé du mois à partir d'une date
   */
  private getMoisLabel(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMMM yyyy', { locale: fr });
    } catch {
      return 'période concernée';
    }
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

export const documentPaiementService = new DocumentPaiementService();