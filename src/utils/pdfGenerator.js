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
    const lineHeight = 16;
    let cursorY = margin;

    // Constants for styling
    const TITLE_SIZE = 18;
    const SET_TITLE_SIZE = 14;
    const SONG_TITLE_SIZE = 12;
    const SONG_META_SIZE = 10;
    const SUPERSCRIPT_OFFSET = 4;
    const SUPERSCRIPT_SIZE = 8;
    const PAGE_WIDTH = pdf.internal.pageSize.getWidth();
    const PAGE_HEIGHT = pdf.internal.pageSize.getHeight();

    // Helper: add a new page and reset cursor
    const newPage = () => {
      pdf.addPage();
      cursorY = margin;
    };

    // Render document title
    pdf.setFontSize(TITLE_SIZE);
    pdf.setFont(undefined, 'bold');
    pdf.text(fullSetlist.name, margin, cursorY);
    cursorY += TITLE_SIZE + 10;

    // Iterate sets
    for (let i = 0; i < fullSetlist.sets.length; i++) {
      const { id: setId } = fullSetlist.sets[i];
      const detailedSet = await setsService.getSetById(setId);

      // Start each set on its own page except the first
      if (i > 0) newPage();

      // Render set name
      pdf.setFontSize(SET_TITLE_SIZE);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(detailedSet.name, margin, cursorY);
      cursorY += SET_TITLE_SIZE + 8;

      // Sort songs by order
      const songs = (detailedSet.set_songs || [])
        .slice()
        .sort((a, b) => (a.song_order || 0) - (b.song_order || 0))
        .map(ss => ss.songs);

      // Render each song
      for (const song of songs) {
        // Ensure space for next entry
        if (cursorY > PAGE_HEIGHT - margin) {
          newPage();
        }

        // Song title (bold, larger)
        pdf.setFontSize(SONG_TITLE_SIZE);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(song.title, margin, cursorY);
        cursorY += SONG_TITLE_SIZE + 2;

        // Draw performance note in brackets
        if (song.performance_note) {
          const note = `***${song.performance_note}***`;
          pdf.text(note, xOffset, cursorY);
        }
        
        // Song metadata: artist (lighter), key (superscript), performance note
        pdf.setFontSize(SONG_META_SIZE);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);

        const metaX = margin;
        let metaText = song.original_artist || '-';
        let xOffset = metaX;

        // Draw artist
        pdf.text(metaText, xOffset, cursorY);
        xOffset += pdf.getTextWidth(metaText) + 4;

        // Draw key signature as superscript
        if (song.key_signature) {
          pdf.setFontSize(SUPERSCRIPT_SIZE);
          pdf.text(
            song.key_signature,
            xOffset,
            cursorY - SUPERSCRIPT_OFFSET
          );
          xOffset += pdf.getTextWidth(song.key_signature) + 4;
          // Restore meta size
          pdf.setFontSize(SONG_META_SIZE);
        }

        

        // Advance cursor past metadata
        cursorY += SONG_META_SIZE + 8;
      }
    }

    // Prepare filename and output
    const safeName = fullSetlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeName}_setlist.pdf`;
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    // Open print dialog or download
    const printWin = window.open(url, '_blank');
    if (printWin) {
      printWin.onload = () => printWin.print();
    } else {
      pdf.save(filename);
    }
  } catch (err) {
    console.error('Error generating setlist PDF:', err);
    throw err;
  }
};
