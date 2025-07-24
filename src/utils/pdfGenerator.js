import jsPDF from 'jspdf';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';

export const generateSetlistPDF = async (setlist) => {
  try {
    // Fetch the full setlist with sets
    const fullSetlist = await setlistsService.getSetlistById(setlist.id);
    
    // Create new PDF document
    const pdf = new jsPDF();
    
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

    const img = new Image();
    img.src = "./bh-logo-bw.png";
    await img.decode();
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    
    
    pdf.addImage(img, "PNG", 0, 0, pageW, pageH);
    pdf.restoreGraphicsState();

    
    // Title
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(fullSetlist.name, margin, yPosition);
    yPosition += 20;
    
    // Process each set
    for (let setIndex = 0; setIndex < fullSetlist.sets.length; setIndex++) {
      const set = fullSetlist.sets[setIndex];

      const detailedSet = await setsService.getSetById(set.id);

      // Check if we need a new page for this set
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      // Set name
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(detailedSet.name, margin, yPosition);
      yPosition += 15;

      // Songs in the set
      const songs = detailedSet.set_songs
        ?.map(ss => ss.songs)
        .sort((a, b) => (detailedSet.set_songs.find(ss => ss.songs.id === a.id)?.song_order || 0) - 
                        (detailedSet.set_songs.find(ss => ss.songs.id === b.id)?.song_order || 0)) || [];

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');

      for (const song of songs) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        // Format: "Title by Artist [Key]"
        let songText = `${song.title} by ${song.original_artist}`;
        if (song.key_signature) {
          songText += ` [${song.key_signature}]`;
        }

        pdf.text(songText, margin, yPosition);
        yPosition += 10; // Extra space between songs
      }

      // Extra space between sets
      yPosition += 10;
    }
    
    // Generate filename
    const filename = `${fullSetlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_setlist.pdf`;
    
    // Show print dialog
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open print dialog
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      // Fallback: download the PDF
      pdf.save(filename);
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};