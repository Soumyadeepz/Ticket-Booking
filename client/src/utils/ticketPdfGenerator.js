import api from '../api/axios';

const escapePdfText = (str = '') =>
  String(str)
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

/**
 * Generates a valid %PDF-1.4 binary E-Ticket directly in the browser as a resilient fallback
 * whenever offline/demo bookings are used or if a mobile network proxy interrupts the server stream.
 */
export function generateClientSideTicketPdfBytes(booking) {
  const code = escapePdfText(booking?.bookingCode || booking?._id || 'TB-TICKET');
  const title = escapePdfText(booking?.event?.title || 'Cinema & Live Show').slice(0, 42);
  const categoryLang = escapePdfText(
    `${booking?.event?.category || 'Movie'} - ${booking?.event?.language || 'English'}`
  );
  const venueLine = escapePdfText(
    `${booking?.show?.venue?.name || 'Grand IMAX Multiplex'} - ${
      booking?.show?.venue?.screenName || 'Screen 1'
    }`
  ).slice(0, 52);
  const addressLine = escapePdfText(
    `${booking?.show?.venue?.address || 'Main Entertainment Avenue'}, ${
      booking?.show?.venue?.city || 'Mumbai'
    }`
  ).slice(0, 62);
  const showDateStr = escapePdfText(
    booking?.show?.startTime
      ? new Date(booking.show.startTime).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Scheduled Showtime'
  );
  const seatsStr = escapePdfText(
    (booking?.seats || []).map((s) => `${s.seatId} (${s.category || 'STD'})`).join(', ') ||
      (booking?.seatIds || []).join(', ') ||
      'Confirmed Seat(s)'
  ).slice(0, 54);
  const amountStr = escapePdfText(
    `INR ${booking?.totalAmount || 0} (${booking?.paymentStatus || 'PAID'} - ${
      booking?.status || 'CONFIRMED'
    })`
  );

  // Build deterministic pseudo-QR matrix from booking code for visual check-in box
  let qrOps = '';
  const seedStr = String(booking?.bookingCode || 'TICKETBOOK2026');
  const gridN = 11;
  const cellSize = 8;
  const qrStartX = 408;
  const qrStartY = 435;
  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      const isFinder =
        (r < 3 && c < 3) || (r < 3 && c >= gridN - 3) || (r >= gridN - 3 && c < 3);
      const charCode = seedStr.charCodeAt((r * gridN + c) % seedStr.length) || 65;
      const bit = isFinder || ((charCode + r * 17 + c * 31) % 3 !== 0);
      if (bit) {
        const x = qrStartX + c * cellSize;
        const y = qrStartY + (gridN - 1 - r) * cellSize;
        qrOps += `${x} ${y} ${cellSize - 1} ${cellSize - 1} re f\n`;
      }
    }
  }

  // PDF coordinate system has origin (0,0) at bottom-left of A4 (595 x 842)
  const contentStream = [
    'q',
    // Header Banner (#0c0c14)
    '0.047 0.047 0.078 rg',
    '40 725 515 75 re f',
    // Purple accent bar (#a855f7)
    '0.659 0.333 0.969 rg',
    '40 796 515 4 re f',
    // Main Ticket Card Body (#181824)
    '0.094 0.094 0.141 rg',
    '40 400 515 310 re f',
    '0.18 0.18 0.259 RG',
    '1.5 w',
    '40 400 515 310 re S',
    // Poster Placeholder Box (#27273a)
    '0.153 0.153 0.227 rg',
    '60 525 115 165 re f',
    // QR White Card Box
    '1 1 1 rg',
    '390 415 145 150 re f',
    // QR dark modules
    '0.035 0.035 0.043 rg',
    qrOps.trim(),
    // Header Text
    'BT',
    '/F2 10 Tf',
    '0.659 0.333 0.969 rg',
    '62 775 Td',
    '(TICKETBOOK OFFICIAL E-TICKET) Tj',
    'ET',
    'BT',
    '/F2 20 Tf',
    '1 1 1 rg',
    '62 746 Td',
    `(${title}) Tj`,
    'ET',
    'BT',
    '/F2 13 Tf',
    '0.957 0.247 0.369 rg',
    '425 752 Td',
    `(${code}) Tj`,
    'ET',
    // Poster Box Label
    'BT',
    '/F2 11 Tf',
    '0.659 0.333 0.969 rg',
    '82 605 Td',
    '(ADMIT ONE) Tj',
    'ET',
    // Event & Category
    'BT',
    '/F2 9 Tf',
    '0.631 0.631 0.667 rg',
    '195 678 Td',
    '(EVENT & CATEGORY) Tj',
    'ET',
    'BT',
    '/F2 13 Tf',
    '1 1 1 rg',
    '195 660 Td',
    `(${title} [${categoryLang}]) Tj`,
    'ET',
    // Venue & Auditorium
    'BT',
    '/F2 9 Tf',
    '0.631 0.631 0.667 rg',
    '195 626 Td',
    '(VENUE & AUDITORIUM) Tj',
    'ET',
    'BT',
    '/F1 12 Tf',
    '1 1 1 rg',
    '195 609 Td',
    `(${venueLine}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '0.831 0.831 0.847 rg',
    '195 593 Td',
    `(${addressLine}) Tj`,
    'ET',
    // Date & Showtime
    'BT',
    '/F2 9 Tf',
    '0.631 0.631 0.667 rg',
    '195 562 Td',
    '(DATE & SHOWTIME) Tj',
    'ET',
    'BT',
    '/F2 12 Tf',
    '0.063 0.725 0.506 rg',
    '195 545 Td',
    `(${showDateStr}) Tj`,
    'ET',
    // Confirmed Seats
    'BT',
    '/F2 9 Tf',
    '0.631 0.631 0.667 rg',
    '60 492 Td',
    '(CONFIRMED SEATS) Tj',
    'ET',
    'BT',
    '/F2 13 Tf',
    '1 1 1 rg',
    '60 474 Td',
    `(${seatsStr}) Tj`,
    'ET',
    // Total Paid
    'BT',
    '/F2 9 Tf',
    '0.631 0.631 0.667 rg',
    '60 442 Td',
    '(TOTAL PAID) Tj',
    'ET',
    'BT',
    '/F2 15 Tf',
    '0.957 0.247 0.369 rg',
    '60 422 Td',
    `(${amountStr}) Tj`,
    'ET',
    // QR Caption
    'BT',
    '/F2 8 Tf',
    '0.035 0.035 0.043 rg',
    '404 422 Td',
    `(SCAN AT ENTRY: ${code}) Tj`,
    'ET',
    // Footer Instructions
    'BT',
    '/F1 9 Tf',
    '0.443 0.443 0.478 rg',
    '75 375 Td',
    '(Present this PDF ticket or QR code at the venue entrance. Valid photo ID required.) Tj',
    'ET',
    'Q',
  ].join('\n');

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'
  );
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n'
  );
  objects.push(
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  );

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const encoder = new TextEncoder();
  return encoder.encode(pdf);
}

/**
 * Triggers a cross-browser & mobile-safe file download for a PDF byte array.
 */
export function triggerPdfDownload(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    window.URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Downloads the official booking PDF ticket from the server (verifying %PDF magic bytes),
 * and automatically falls back to client-side PDF generation if the network/server is unreachable.
 */
export async function downloadBookingTicketPdf(booking) {
  const filename = `TicketBook-${booking?.bookingCode || booking?._id || 'Ticket'}.pdf`;

  if (booking?._id && !String(booking._id).startsWith('mock-')) {
    try {
      const res = await api.get(`/bookings/${booking._id}/ticket`, {
        responseType: 'arraybuffer',
      });
      const bytes = new Uint8Array(res.data);
      // Verify %PDF magic header (0x25 0x50 0x44 0x46)
      if (
        bytes.length > 200 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46
      ) {
        triggerPdfDownload(bytes, filename);
        return filename;
      }
    } catch {
      // Fall through to client-side PDF generator so user always gets their PDF ticket
    }
  }

  const fallbackBytes = generateClientSideTicketPdfBytes(booking);
  triggerPdfDownload(fallbackBytes, filename);
  return filename;
}
