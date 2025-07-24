// pdfGenerator.jsx
import jsPDF from 'jspdf';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';

/**
 * Generates and prints/downloads a setlist PDF based on the provided setlist data.
 * @param {{ id: string, name: string }} setlist - The basic setlist info (id and name).
 */
export const generateSetlistPDF = async (setlist) => {
  try {
    // Fetch complete setlist with nested sets and songs
    const fullSetlist = await setlistsService.getSetlistById(setlist.id);

    // Initialize PDF document
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 40;
    const PAGE_HEIGHT = pdf.internal.pageSize.getHeight();
    let cursorY = margin;

    // Styling constants
    const TITLE_SIZE     = 18;
    const SET_TITLE_SIZE = 16;
    const SONG_TITLE_SIZE  = 16;
    const SONG_META_SIZE   = 12;
    const LINE_SPACING     = 6;  // extra space between lines

    // Add a new page helper
    const newPage = () => {
      pdf.addPage();
      cursorY = margin;
    };

    // Draw document title
    pdf.setFontSize(TITLE_SIZE);
    pdf.setFont(undefined, 'bold');
    pdf.text(fullSetlist.name, margin, cursorY);
    cursorY += TITLE_SIZE + LINE_SPACING * 2;

    // Iterate each set
    for (let i = 0; i < fullSetlist.sets.length; i++) {
      const { id: setId } = fullSetlist.sets[i];
      const detailedSet = await setsService.getSetById(setId);

      // New page per set (except first)
      if (i > 0) newPage();

      // Draw set name
      pdf.setFontSize(SET_TITLE_SIZE);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(detailedSet.name, margin, cursorY);
      cursorY += SET_TITLE_SIZE + LINE_SPACING;

      // Sort songs
      const songs = (detailedSet.set_songs || [])
        .slice()
        .sort((a, b) => (a.song_order || 0) - (b.song_order || 0))
        .map(ss => ss.songs);

      // Render songs on one line each
      for (const song of songs) {
        // Page break if needed
        if (cursorY > PAGE_HEIGHT - margin) {
          newPage();
        }

        let x = margin;
        const y = cursorY;

        // Title: 16pt, bold, black
        pdf.setFontSize(SONG_TITLE_SIZE);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${song.title} | `, x, y);
        x += pdf.getTextWidth(song.title) + 8;

        // Artist: 12pt, grey
        pdf.setFontSize(SONG_META_SIZE);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);
        const artistText = song.original_artist || '';
        pdf.text(artistText, x, y);
        x += pdf.getTextWidth(artistText) + 8;

        // Key signature: 12pt, grey
        if (song.key_signature) {
          pdf.text(`${song.key_signature}`, x, y);
          x += pdf.getTextWidth(song.key_signature) + 8;
        }

        // Performance note: 12pt, grey, prefixed "Note:"
        if (song.performance_note) {
          const noteText = ` | Note: ${song.performance_note}`;
          pdf.text(noteText, x, y);
        }

        // Advance cursor for next song
        cursorY += SONG_TITLE_SIZE + LINE_SPACING;
      }
    }

    // Output PDF
    const safeName = fullSetlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeName}_setlist.pdf`;
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    } else {
      pdf.save(filename);
    }
  } catch (err) {
    console.error('Error generating setlist PDF:', err);
    throw err;
  }
};