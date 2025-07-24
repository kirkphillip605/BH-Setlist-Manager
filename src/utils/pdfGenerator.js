import jsPDF from 'jspdf';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';

export const generateSetlistPDF = async (setlist) => {
  try {
    // Fetch the full setlist with sets
    const fullSetlist = await setlistsService.getSetlistById(setlist.id);
    
    // Create new PDF document
    const pdf = new jsPDF();
    
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    
    // Function to add logo to each page
    const addLogoToPage = () => {
      try {
        // Add logo to top right (using a placeholder for now since we can't access the actual file)
        // In a real implementation, you would load the image file and add it
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text('Bad Habits', pageWidth - margin - 30, margin);
      } catch (error) {
        console.warn('Could not add logo to PDF:', error);
      }
    };
    
    let yPosition = 20;
    
    // Add logo to first page
    addLogoToPage();
    yPosition += 10;
    
    // Setlist title - centered and bold
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    const titleWidth = pdf.getTextWidth(fullSetlist.name);
    const titleX = (pageWidth - titleWidth) / 2;
    pdf.text(fullSetlist.name, titleX, yPosition);
    yPosition += 30;
    
    // Process each set
    for (let setIndex = 0; setIndex < fullSetlist.sets.length; setIndex++) {
      const set = fullSetlist.sets[setIndex];
      
      // Start each set on a new page (except the first one)
      if (setIndex > 0) {
        pdf.addPage();
        addLogoToPage();
        yPosition = 30;
      }
      
      const detailedSet = await setsService.getSetById(set.id);
      
      // Set name - bold and larger
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text(detailedSet.name, margin, yPosition);
      yPosition += 20;
      
      // Songs in the set
      const songs = detailedSet.set_songs
        ?.map(ss => ss.songs)
        .sort((a, b) => (detailedSet.set_songs.find(ss => ss.songs.id === a.id)?.song_order || 0) - 
                        (detailedSet.set_songs.find(ss => ss.songs.id === b.id)?.song_order || 0)) || [];
      
      for (const song of songs) {
        // Check if we need a new page for this song
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          addLogoToPage();
          yPosition = 30;
        }
        
        // Song title - bold and larger
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        let songTitleText = song.title;
        
        // Measure title width for positioning
        const titleTextWidth = pdf.getTextWidth(songTitleText);
        pdf.text(songTitleText, margin, yPosition);
        
        // Artist and key - normal size, positioned after title
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        let artistKeyText = ` -- ${song.original_artist}`;
        
        if (song.key_signature) {
          artistKeyText += ` - `;
          pdf.text(artistKeyText, margin + titleTextWidth, yPosition);
          
          // Key signature as superscript
          const artistKeyWidth = pdf.getTextWidth(artistKeyText);
          pdf.setFontSize(8);
          pdf.text(song.key_signature, margin + titleTextWidth + artistKeyWidth, yPosition - 2);
        } else {
          pdf.text(artistKeyText, margin + titleTextWidth, yPosition);
        }
        
        yPosition += 15;
        
        // Performance note if exists
        if (song.performance_note) {
          // Check if we need a new page for the performance note
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            addLogoToPage();
            yPosition = 30;
          }
          
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'normal');
          pdf.text(`• ${song.performance_note}`, margin + 5, yPosition);
          yPosition += 12;
        }
        
        // Extra space between songs
        yPosition += 5;
      }
      
      // Extra space between sets (if not starting a new page)
      yPosition += 15;
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