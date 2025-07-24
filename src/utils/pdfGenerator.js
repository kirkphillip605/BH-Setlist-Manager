// File: pdfUtils.js
import jsPDF from 'jspdf';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';

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
    const logo = "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";
    // logo.src   = './bh-logo-bw.png';
    // await logo.decode();

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