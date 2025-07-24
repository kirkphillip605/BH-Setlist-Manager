// File: pdfUtils.js
import jsPDF from 'jspdf';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';
import { logo } from '../bh-logo-bw.png';
/**
 * Add the common header (logo + setlist title) to the current PDF page.
 * @param {jsPDF} pdf Active jsPDF instance.
 * @param {string} title The setlist name.
 * @param {HTMLImageElement} logo Pre-decoded logo image.
 * @param {number} margin Horizontal margin in points.
 * @returns {number} The initial y position after drawing the header.
 */
function addHeader(pdf, title, logo, margin = 20) {
  const pageWidth   = pdf.internal.pageSize.getWidth();
  const logoWidth   = 30;            // pts (~0.42")
  const logoHeight  = (logo.height / logo.width) * logoWidth;

  // Logo (top-right)
  pdf.addImage(
    logo,
    'PNG',
    pageWidth - margin - logoWidth,
    10,               // y-pos: fixed 10 pt from top
    logoWidth,
    logoHeight
  );

  // Title (top-left)
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text(title, margin, 20);

  // Return the y-cursor just below the header
  return 40;
}

/**
 * Generate a printable PDF of a setlist.
 * Each set starts on a new page and every page shows the logo in the header.
 * @param {{ id: string }} setlist Lightweight setlist record (id + name).
 */
export const generateSetlistPDF = async (setlist) => {
  try {
    /* ------------------------------------------------------------------ */
    /* 1. Load all required data                                          */
    /* ------------------------------------------------------------------ */
    const fullSetlist   = await setlistsService.getSetlistById(setlist.id);

    // Pre-load logo once. Using decode() guarantees it is ready for jsPDF.
    const logo = new Image();
    // logo.src   = './bh-logo-bw.png';
    await logo.decode();

    /* ------------------------------------------------------------------ */
    /* 2. Initialise PDF                                                  */
    /* ------------------------------------------------------------------ */
    const pdf           = new jsPDF();
    const margin        = 20;
    let y               = addHeader(pdf, fullSetlist.name, logo, margin);

    const pageHeight    = pdf.internal.pageSize.getHeight();
    const songSpacing   = 10;

    /* ------------------------------------------------------------------ */
    /* 3. Iterate sets – one page per set                                 */
    /* ------------------------------------------------------------------ */
    for (let index = 0; index < fullSetlist.sets.length; index++) {
      const setSummary  = fullSetlist.sets[index];
      const set         = await setsService.getSetById(setSummary.id);

      // On first iteration we are already on page 1; subsequent sets get a new page.
      if (index > 0) {
        pdf.addPage();
        y = addHeader(pdf, fullSetlist.name, logo, margin);
      }

      /* -------------------- 3a. Set heading --------------------------- */
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(set.name, margin, y);
      y += 15;

      /* -------------------- 3b. Songs (ordered) ----------------------- */
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');

      const songs = (set.set_songs ?? [])
        .sort((a, b) => a.song_order - b.song_order)       // already have order
        .map((ss) => ss.songs);

      for (const song of songs) {
        const line = `${song.title} by ${song.original_artist}${
          song.key_signature ? ` [${song.key_signature}]` : ''
        }`;

        // Simple overflow check – if song won't fit, start a new page (w/ header)
        if (y + songSpacing > pageHeight - margin) {
          pdf.addPage();
          y = addHeader(pdf, fullSetlist.name, logo, margin);

          // Draw the set heading again for context
          pdf.setFontSize(16);
          pdf.setFont(undefined, 'bold');
          pdf.text(set.name, margin, y);
          y += 15;

          pdf.setFontSize(12);
          pdf.setFont(undefined, 'normal');
        }

        pdf.text(line, margin, y);
        y += songSpacing;
      }
    }

    /* ------------------------------------------------------------------ */
    /* 4. Present PDF (print dialog preferred, fallback to download)      */
    /* ------------------------------------------------------------------ */
    const fileName  = `${fullSetlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_setlist.pdf`;
    const blob      = pdf.output('blob');
    const url       = URL.createObjectURL(blob);

    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => win.print();
    } else {
      pdf.save(fileName);
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
};