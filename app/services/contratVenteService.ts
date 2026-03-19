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

interface ContratVenteData {
  numero_contrat: string;
  date_signature: string;
  vendeur: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  acheteur: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    date_naissance?: string;
    lieu_naissance?: string;
    nationalite?: string;
    profession?: string;
  };
  bien: {
    nom: string;
    adresse: string;
    quartier?: string;
    commune: string;
    ville: string;
    district: string;
    surface: number;
    pieces: number;
    etage?: number;
    description?: string;
  };
  prix_vente: number;
  modalites_paiement?: string;
  clause_particuliere?: string;
  entreprise: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
  };
}

class ContratVenteService {
  
  async genererContratVente(data: ContratVenteData): Promise<void> {
    
    const prixLettres = this.nombreEnLettres(data.prix_vente);
    
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
                    text: "CONTRAT DE VENTE IMMOBILIÈRE",
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

          // Numéro de contrat
          new Paragraph({
            children: [
              new TextRun({
                text: `CONTRAT N° ${data.numero_contrat}`,
                bold: true,
                size: 28,
                font: "Times New Roman",
                color: "D4AF37",
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

          // Vendeur
          new Paragraph({
            children: [
              new TextRun({
                text: "LE VENDEUR",
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
                text: `${data.vendeur.prenom} ${data.vendeur.nom}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Email : ${data.vendeur.email}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Tél : ${data.vendeur.telephone}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Acheteur
          new Paragraph({
            children: [
              new TextRun({
                text: "L'ACHETEUR",
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
                text: `${data.acheteur.prenom} ${data.acheteur.nom}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              ...(data.acheteur.date_naissance ? [
                new TextRun({
                  text: `Né(e) le ${format(new Date(data.acheteur.date_naissance), 'dd MMMM yyyy', { locale: fr })}`,
                  size: 24,
                  font: "Times New Roman",
                }),
                new TextRun({ text: "\n", break: 1 }),
              ] : []),
              ...(data.acheteur.lieu_naissance ? [
                new TextRun({
                  text: `à ${data.acheteur.lieu_naissance}`,
                  size: 24,
                  font: "Times New Roman",
                }),
                new TextRun({ text: "\n", break: 1 }),
              ] : []),
              ...(data.acheteur.nationalite ? [
                new TextRun({
                  text: `Nationalité : ${data.acheteur.nationalite}`,
                  size: 24,
                  font: "Times New Roman",
                }),
                new TextRun({ text: "\n", break: 1 }),
              ] : []),
              ...(data.acheteur.profession ? [
                new TextRun({
                  text: `Profession : ${data.acheteur.profession}`,
                  size: 24,
                  font: "Times New Roman",
                }),
                new TextRun({ text: "\n", break: 1 }),
              ] : []),
              new TextRun({
                text: `Email : ${data.acheteur.email}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Tél : ${data.acheteur.telephone}`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Objet
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
                text: `Le vendeur vend à l'acheteur, qui accepte, le bien immobilier situé à :`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `${data.bien.adresse}, ${data.bien.quartier ? `Quartier ${data.bien.quartier}, ` : ''}${data.bien.commune}, ${data.bien.district}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `Désigné sous le nom : ${data.bien.nom}`,
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\n", break: 1 }),
              new TextRun({
                text: `D'une superficie de ${data.bien.surface} m², comprenant ${data.bien.pieces} pièces${data.bien.etage ? `, situé au ${data.bien.etage}ème étage` : ''}.`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Article 2 - Prix
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 2 : PRIX",
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
                text: `Le prix de vente est fixé à : ${data.prix_vente.toLocaleString()} FCFA (${prixLettres.toUpperCase()}).`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          ...(data.modalites_paiement ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Modalités de paiement : ${data.modalites_paiement}`,
                  size: 24,
                  font: "Times New Roman",
                }),
              ],
              spacing: { after: 200 },
            })
          ] : []),

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
                    shading: { fill: "F4E5B9" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Détails", bold: true })] })],
                    shading: { fill: "F4E5B9" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Montant (FCFA)", bold: true })] })],
                    shading: { fill: "F4E5B9" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Prix de vente" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Vente immobilière" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.prix_vente.toLocaleString() })] })],
                  }),
                ],
              }),
            ],
          }),

          // Article 3 - Description du bien
          ...(data.bien.description ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "ARTICLE 3 : DESCRIPTION DU BIEN",
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
                  text: data.bien.description,
                  size: 24,
                  font: "Times New Roman",
                }),
              ],
              spacing: { after: 200 },
            })
          ] : []),

          // Clause particulière
          ...(data.clause_particuliere ? [
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
                  text: data.clause_particuliere,
                  size: 24,
                  font: "Times New Roman",
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            })
          ] : []),

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
                text: format(new Date(data.date_signature), 'dd MMMM yyyy', { locale: fr }),
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
                text: "Signature du Vendeur",
                size: 24,
                font: "Times New Roman",
              }),
              new TextRun({ text: "\t\t\t\t\t\t\t\t", break: 1 }),
              new TextRun({
                text: "Signature de l'Acheteur",
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
                text: "(Précédé de la mention 'Lu et approuvé')",
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Contrat_Vente_${data.numero_contrat}_${data.acheteur.nom}.docx`);
  }

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
}

export const contratVenteService = new ContratVenteService();