// utils/pdfGenerator.js
import jsPDF from 'jspdf';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';
import logoSrc from '../bh-logo-bw.png?url';   // <-- lets Vite resolve the real URL

// ———————————————————————————————————————————
// 1. Utility to load an image as an <img> element, waiting for decode()
// ———————————————————————————————————————————
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';   // keeps the canvas from being tainted
    img.onload = () => img.decode().then(() => resolve(img)).catch(reject);
    img.onerror = reject;
    img.src = src;
  });
}

// ———————————————————————————————————————————
// 2. Header helper (unchanged except for parameter list)
// ———————————————————————————————————————————
function addHeader(pdf, title, logo, margin = 20) {
  const pageWidth  = pdf.internal.pageSize.getWidth();
  const logoWidth  = 30;
  const logoHeight = (logo.height / logo.width) * logoWidth;

  pdf.addImage(logo, 'PNG',
               pageWidth - margin - logoWidth, 10,
               logoWidth, logoHeight);

  pdf.setFontSize(20).setFont(undefined, 'bold');
  pdf.text(title, margin, 20);

  return 40;                       // new cursor Y
}

// ———————————————————————————————————————————
// 3. Main generator
// ———————————————————————————————————————————
export const generateSetlistPDF = async (setlist) => {
  try {
    const fullSetlist = await setlistsService.getSetlistById(setlist.id);
    const logo        = await loadImage(logoSrc);            // <- guaranteed loaded

    const pdf         = new jsPDF();
    const margin      = 20;
    let   y           = addHeader(pdf, fullSetlist.name, logo, margin);
    const pageHeight  = pdf.internal.pageSize.getHeight();

    /* === iterate sets (identical to previous version) =================== */
    for (let i = 0; i < fullSetlist.sets.length; i++) {
      const set = await setsService.getSetById(fullSetlist.sets[i].id);

      if (i > 0) {                         // force new page for every set
        pdf.addPage();
        y = addHeader(pdf, fullSetlist.name, logo, margin);
      }

      pdf.setFontSize(16).setFont(undefined, 'bold');
      pdf.text(set.name, margin, y);
      y += 15;

      pdf.setFontSize(12).setFont(undefined, 'normal');
      const songs = (set.set_songs ?? [])
        .sort((a, b) => a.song_order - b.song_order)
        .map(ss => ss.songs);

      for (const song of songs) {
        if (y + 10 > pageHeight - margin) {
          pdf.addPage();
          y = addHeader(pdf, fullSetlist.name, logo, margin);
          pdf.setFontSize(16).setFont(undefined, 'bold').text(set.name, margin, y);
          y += 15;
          pdf.setFontSize(12).setFont(undefined, 'normal');
        }

        const line = `${song.title} by ${song.original_artist}` +
                     (song.key_signature ? ` [${song.key_signature}]` : '');
        pdf.text(line, margin, y);
        y += 10;
      }
    }

    const blob = pdf.output('blob');
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    win ? win.onload = () => win.print() : pdf.save(
      `${fullSetlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_setlist.pdf`
    );
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;                     // still bubbled to caller
  }
};