import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any) => string;
}

export class ExportService {
  /**
   * Exporte les données vers un fichier Excel
   */
  static exporterExcel(data: any[], columns: ExportColumn[], nomFichier: string): void {
    // Transformer les données pour Excel
    const excelData = data.map(item => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        const value = item[col.key];
        row[col.header] = col.format ? col.format(value) : (value !== undefined && value !== null ? value : '');
      });
      return row;
    });

    // Créer la feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Ajuster la largeur des colonnes
    const colWidths = columns.map(col => ({ wch: Math.max(col.header.length, 20) }));
    worksheet['!cols'] = colWidths;
    
    // Créer le classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Biens');
    
    // Générer et télécharger le fichier
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nomFichier}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
  }

  /**
   * Imprime la page actuelle
   */
  static imprimer(): void {
    window.print();
  }

  /**
   * Exporte les données en HTML pour impression
   */
  static genererHtmlPourImpression(data: any[], columns: ExportColumn[], titre: string): string {
    const rows = data.map(item => {
      return `
        <tr>
          ${columns.map(col => `<td>${col.format ? col.format(item[col.key]) : (item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '')}</td>`).join('')}
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${titre}</title>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            margin: 20px;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #D4AF37;
          }
          .header h1 {
            color: #1A2F4B;
            margin: 0;
          }
          .header p {
            color: #666;
            margin: 5px 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #D4AF37;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
          }
          tr:hover {
            background: #f5f5f5;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titre}</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          <p>Document généré par ImmoLion - Gestion Immobilière</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Imprime les données filtrées
   */
  static imprimerDonnees(data: any[], columns: ExportColumn[], titre: string): void {
    const html = this.genererHtmlPourImpression(data, columns, titre);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  }
}