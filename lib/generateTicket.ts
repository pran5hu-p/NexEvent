import jsPDF from 'jspdf';

interface EventDetails {
  title: string;
  date: string | Date;
  location: string;
}

export function downloadTicket(event: EventDetails, qrCodeDataUrl: string) {
  const doc = new jsPDF();

  // Add Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(event.title, 20, 20);

  // Add Details
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date(event.date).toLocaleString()}`, 20, 32);
  doc.text(`Location: ${event.location}`, 20, 40);

  // Add QR Code
  doc.addImage(qrCodeDataUrl, 'PNG', 20, 50, 60, 60);

  // Download the file
  const safeFilename = event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  doc.save(`${safeFilename}-ticket.pdf`);
}