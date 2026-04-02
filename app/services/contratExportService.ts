import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  Table,
  TableRow,
  TableCell,
  VerticalAlign,
  Footer,
  Header,
  ImageRun,
  PageBreak
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContratData {
  id: number;
  numero_contrat: string;
  type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  date_signature: string | null;
  loyer_mensuel: number;
  charges_mensuelles: number;
  depot_garantie: number | null;
  clause_particuliere: string | null;
  statut: string;
  bien: {
    id: number;
    nom: string;
    adresse: string;
    quartier?: string;
    commune: string;
    ville: string;
    district: string;
    surface: number;
    pieces: number;
    etage?: number;
    type_bien?: string;
    description?: string;
  };
  lot?: {
    id: number;
    numero_lot: string;
    type_lot: string;
    surface: number;
    pieces: number | null;
    loyer_mensuel: number;
    charges: number;
    immeuble?: {
      id: number;
      nom: string;
    };
  };
  locataire: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    date_naissance?: string;
    lieu_naissance?: string;
    nationalite?: string;
    profession?: string;
    employeur?: string;
  };
  proprietaire?: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

class ContratExportService {
  
  /**
   * Formate un montant de manière sécurisée
   */
  private formatMontant(montant: number | null | undefined): string {
    if (montant === null || montant === undefined) return '0';
    return montant.toLocaleString();
  }

  /**
   * Récupère le montant du dépôt de garantie
   */
  private getDepotGarantie(contrat: ContratData): number {
    if (contrat.depot_garantie !== null && contrat.depot_garantie !== undefined) {
      return contrat.depot_garantie;
    }
    // Si pas de dépôt de garantie, utiliser 2 mois de loyer par défaut
    return contrat.loyer_mensuel * 2;
  }

  /**
   * Récupère la description du bien (avec gestion des lots)
   */
  private getDescriptionBien(contrat: ContratData): string {
    let description = '';
    
    if (contrat.lot && contrat.lot.immeuble) {
      // Cas d'un lot dans un immeuble
      description = `Immeuble "${contrat.bien.nom}" - Lot n° ${contrat.lot.numero_lot}`;
      description += `, ${contrat.lot.type_lot} de ${contrat.lot.surface} m²`;
      if (contrat.lot.pieces) {
        description += `, ${contrat.lot.pieces} pièces`;
      }
      description += `, situé au ${contrat.bien.adresse}, ${contrat.bien.commune}, ${contrat.bien.district}`;
    } else {
      // Cas d'un bien simple
      description = `Le bien immobilier situé à : ${contrat.bien.adresse}, ${contrat.bien.quartier ? `Quartier ${contrat.bien.quartier}, ` : ''}${contrat.bien.commune}, ${contrat.bien.district}`;
      description += `\nDésigné sous le nom : ${contrat.bien.nom}`;
      description += `\nD'une superficie de ${contrat.bien.surface} m², comprenant ${contrat.bien.pieces} pièces`;
      if (contrat.bien.etage) {
        description += `, situé au ${contrat.bien.etage}ème étage`;
      }
    }
    
    return description;
  }

  /**
   * Génère un document Word à partir des données du contrat
   */
  async genererContratWord(contrat: ContratData): Promise<void> {
    
    // Formater les dates
    const dateDebut = contrat.date_debut ? format(new Date(contrat.date_debut), 'dd MMMM yyyy', { locale: fr }) : '_____';
    const dateFin = contrat.date_fin ? format(new Date(contrat.date_fin), 'dd MMMM yyyy', { locale: fr }) : '_____';
    const dateSignature = contrat.date_signature ? format(new Date(contrat.date_signature), 'dd MMMM yyyy', { locale: fr }) : format(new Date(), 'dd MMMM yyyy', { locale: fr });
    
    // Montants en lettres
    const loyerEnLettres = this.nombreEnLettres(contrat.loyer_mensuel);
    const depotGarantie = this.getDepotGarantie(contrat);
    const depotEnLettres = this.nombreEnLettres(depotGarantie);
    const totalMensuel = contrat.loyer_mensuel + (contrat.charges_mensuelles || 0);
    
    // Description du bien
    const descriptionBien = this.getDescriptionBien(contrat);
    
    // Création du document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 pouce = 1440 twip
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
                    text: "CONTRAT DE LOCATION",
                    bold: true,
                    size: 36,
                    font: "Times New Roman",
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
                    text: `Fait à Abidjan, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`,
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
                    text: "Document généré par ImmoLion - Gestion Immobilière",
                    size: 16,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // Titre
          new Paragraph({
            children: [
              new TextRun({
                text: "CONTRAT DE LOCATION",
                bold: true,
                size: 48,
                font: "Times New Roman",
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Numéro de contrat
          new Paragraph({
            children: [
              new TextRun({
                text: `N° ${contrat.numero_contrat}`,
                size: 28,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Préambule
          new Paragraph({
            children: [
              new TextRun({
                text: "PRÉAMBULE",
                bold: true,
                size: 32,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Entre les soussignés :",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Partie BAILLEUR
          new Paragraph({
            children: [
              new TextRun({
                text: "LE BAILLEUR",
                bold: true,
                size: 28,
                font: "Times New Roman",
                underline: {},
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Monsieur/Madame ${contrat.proprietaire?.prenom || '[Prénom]'} ${contrat.proprietaire?.nom || '[Nom]'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Demeurant à Abidjan, Cocody`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Email : ${contrat.proprietaire?.email || '______________'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Tél : ${contrat.proprietaire?.telephone || '______________'}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Partie LOCATAIRE
          new Paragraph({
            children: [
              new TextRun({
                text: "LE LOCATAIRE",
                bold: true,
                size: 28,
                font: "Times New Roman",
                underline: {},
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Monsieur/Madame ${contrat.locataire.prenom} ${contrat.locataire.nom}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Né(e) le ${contrat.locataire.date_naissance ? format(new Date(contrat.locataire.date_naissance), 'dd MMMM yyyy', { locale: fr }) : '______________'} à ${contrat.locataire.lieu_naissance || '______________'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Nationalité : ${contrat.locataire.nationalite || 'Ivoirienne'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Profession : ${contrat.locataire.profession || '______________'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Employeur : ${contrat.locataire.employeur || '______________'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Demeurant à Abidjan, ${contrat.locataire.telephone || '______________'}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Email : ${contrat.locataire.email}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Tél : ${contrat.locataire.telephone}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Objet du contrat
          new Paragraph({
            children: [
              new TextRun({
                text: "IL A ÉTÉ CONVENU CE QUI SUIT :",
                bold: true,
                size: 28,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          // Article 1 - Désignation du bien
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 1 : DÉSIGNATION DU BIEN",
                bold: true,
                size: 26,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: descriptionBien,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Article 2 - Durée du bail
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 2 : DURÉE DU BAIL",
                bold: true,
                size: 26,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Le présent bail est consenti pour une durée ${contrat.date_fin ? 'déterminée' : 'indéterminée'}.`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Il prend effet à compter du ${dateDebut}`,
                size: 24,
                font: "Times New Roman",
              }),
              ...(contrat.date_fin ? [
                new TextRun({ text: "\n", break: 1 }),
                new TextRun({
                  text: `et se terminera le ${dateFin}.`,
                  size: 24,
                  font: "Times New Roman",
                })
              ] : [
                new TextRun({ text: "\n", break: 1 }),
                new TextRun({
                  text: `Il est conclu pour une durée indéterminée avec possibilité de résiliation sous préavis de 3 mois.`,
                  size: 24,
                  font: "Times New Roman",
                })
              ]),
            ],
            spacing: { after: 200 },
          }),

          // Article 3 - Loyer et charges
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 3 : LOYER ET CHARGES",
                bold: true,
                size: 26,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Le loyer mensuel est fixé à : ${this.formatMontant(contrat.loyer_mensuel)} FCFA (${loyerEnLettres} Francs CFA).`,
                size: 24,
                font: "Times New Roman",
              }),
              ...(contrat.charges_mensuelles > 0 ? [
                new TextRun({ text: "\n", break: 1 }),
                new TextRun({
                  text: `Les charges mensuelles sont de : ${this.formatMontant(contrat.charges_mensuelles)} FCFA.`,
                  size: 24,
                  font: "Times New Roman",
                })
              ] : []),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Le dépôt de garantie s'élève à : ${this.formatMontant(depotGarantie)} FCFA (${depotEnLettres} Francs CFA).`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Le loyer est payable mensuellement et d'avance, au plus tard le 5 de chaque mois.`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Tableau récapitulatif
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
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Montant (FCFA)", bold: true })] })],
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Loyer mensuel" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: this.formatMontant(contrat.loyer_mensuel) })] })],
                  }),
                ],
              }),
              ...(contrat.charges_mensuelles > 0 ? [new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Charges mensuelles" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: this.formatMontant(contrat.charges_mensuelles) })] })],
                  }),
                ],
              })] : []),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Dépôt de garantie", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: this.formatMontant(depotGarantie), bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "TOTAL MENSUEL", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ 
                        text: this.formatMontant(totalMensuel), 
                        bold: true,
                        color: "D4AF37",
                      })] 
                    })],
                  }),
                ],
              }),
            ],
          }),

          // Article 4 - Obligations du locataire
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 4 : OBLIGATIONS DU LOCATAIRE",
                bold: true,
                size: 26,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 400, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Le preneur s'engage à :",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Payer le loyer et les charges aux échéances convenues ;",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• User paisiblement des lieux loués ;",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Répondre des dégradations survenues pendant la jouissance ;",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Autoriser l'accès au logement pour travaux d'entretien ;",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Souscrire une assurance habitation.",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Article 5 - Obligations du bailleur
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 5 : OBLIGATIONS DU BAILLEUR",
                bold: true,
                size: 26,
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Le bailleur s'engage à :",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Délivrer un logement décent et en bon état d'usage ;",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Assurer au preneur une jouissance paisible ;",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Entretenir les parties communes et les gros équipements ;",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "• Effectuer les réparations nécessaires.",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Clause particulière (si existe)
          ...(contrat.clause_particuliere ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "CLAUSES PARTICULIÈRES",
                  bold: true,
                  size: 26,
                  font: "Times New Roman",
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: contrat.clause_particuliere,
                  size: 24,
                  font: "Times New Roman",
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            }),
          ] : []),

          // Signature
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
                text: dateSignature,
                bold: true,
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
                text: "Signature du Bailleur",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\t\t\t\t\t\t\t\t", break: 1 }),
              new TextRun({
                text: "Signature du Locataire",
                size: 24,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.BOTH,
            spacing: { before: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: "(Précédé de la mention 'Lu et approuvé')",
                size: 20,
                font: "Times New Roman",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
          }),
        ],
      }],
    });

    // Générer et télécharger le document
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Contrat_${contrat.numero_contrat}_${contrat.locataire.nom}_${contrat.locataire.prenom}.docx`);
  }

  /**
   * Convertit un nombre en lettres (version simplifiée)
   */
  private nombreEnLettres(nombre: number): string {
    if (nombre === 0) return 'zéro';
    
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
}

export const contratExportService = new ContratExportService();