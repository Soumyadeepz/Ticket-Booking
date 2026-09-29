import nodemailer from 'nodemailer';

let transporter = null;
let usingEthereal = false;

async function getTransporter() {
  const smtpUser = (
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    'dassoumya387@gmail.com'
  ).trim();
  const smtpPass = (
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    'mruqaevhbbervsyi'
  )
    .replace(/\s+/g, '')
    .trim();
  const smtpHost = (process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  if (smtpUser && smtpPass) {
    if (!transporter || usingEthereal) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      usingEthereal = false;
    }
    return transporter;
  }

  // If SMTP_USER/SMTP_PASS are not yet set in .env, try Nodemailer Ethereal test account
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    return transporter;
  } catch {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    usingEthereal = false;
    return transporter;
  }
}

export const sendOtpEmail = async ({ email, name, otp, purpose }) => {
  const actionLabel = purpose === 'REGISTER' ? 'Verify Your Account' : 'Sign-In Verification';
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; background: #09090b; color: #f4f4f5; padding: 36px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
        <span style="background: linear-gradient(135deg, #9333ea, #f43f5e); padding: 8px 14px; border-radius: 10px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">TICKETBOOK</span>
      </div>
      <h2 style="margin: 0 0 12px; font-size: 22px; color: #ffffff;">${actionLabel}</h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
        Hi <strong style="color: #e4e4e7;">${name || email}</strong>, use the 6-digit verification code below to complete your ${purpose === 'REGISTER' ? 'registration' : 'login'} on TicketBook.
      </p>
      <div style="margin: 28px 0; padding: 20px; border-radius: 12px; background: rgba(147, 51, 234, 0.12); border: 1px solid rgba(244, 63, 94, 0.35); text-align: center;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #f43f5e;">${otp}</span>
      </div>
      <p style="color: #71717a; font-size: 13px; margin-top: 24px;">
        This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.
      </p>
    </div>
  `;

  try {
    const mailTransport = await getTransporter();
    const info = await mailTransport.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        `"TicketBook Cinema" <${process.env.SMTP_USER || 'no-reply@ticketbook.dev'}>`,
      to: email,
      subject: `[TicketBook] ${otp} is your ${actionLabel} code`,
      html,
    });
    console.log(`\n📧 [Nodemailer OTP Sent] To: ${email} | Purpose: ${purpose} | OTP: ${otp}`);
    if (usingEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 [Webmail Inbox Preview]: ${previewUrl}\n`);
      }
    }
    return true;
  } catch (err) {
    console.warn(`⚠️ Nodemailer SMTP error (${err.message}). Check SMTP_USER / SMTP_PASS in server/.env.`);
    console.log(`\n📧 [OTP Log] To: ${email} | Purpose: ${purpose} | OTP: ${otp}\n`);
    return false;
  }
};

export const sendBookingConfirmationEmail = async ({ booking, user }) => {
  if (!user?.email || !booking) return false;

  const eventTitle = booking.event?.title || 'TicketBook Event';
  const venueName = booking.show?.venue?.name || 'Main Auditorium';
  const screenName = booking.show?.venue?.screenName || 'Screen 1';
  const showDateStr = booking.show?.startTime
    ? new Date(booking.show.startTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Scheduled Showtime';
  const seatsList = (booking.seatIds || []).join(', ');

  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; background: #09090b; color: #f4f4f5; padding: 36px; border-radius: 16px; max-width: 560px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="margin-bottom: 20px;">
        <span style="background: linear-gradient(135deg, #9333ea, #f43f5e); padding: 8px 14px; border-radius: 10px; font-weight: 800; color: #ffffff;">TICKETBOOK E-TICKET</span>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 24px; color: #10b981;">Booking Confirmed!</h2>
      <p style="color: #a1a1aa; font-size: 14px;">
        Hi <strong>${user.name || user.email}</strong>, your payment was verified and your seats are confirmed.
      </p>
      <div style="margin: 24px 0; padding: 20px; border-radius: 14px; background: #18181b; border: 1px solid #3f3f46;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #a855f7; text-transform: uppercase; font-weight: 700;">Booking Code: ${booking.bookingCode}</p>
        <h3 style="margin: 0 0 12px; font-size: 20px; color: #ffffff;">${eventTitle}</h3>
        <p style="margin: 4px 0; font-size: 14px; color: #d4d4d8;"><strong>Venue:</strong> ${venueName} (${screenName})</p>
        <p style="margin: 4px 0; font-size: 14px; color: #d4d4d8;"><strong>Date & Time:</strong> ${showDateStr}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #d4d4d8;"><strong>Seats:</strong> ${seatsList}</p>
        <p style="margin: 12px 0 0; font-size: 16px; color: #ffffff;"><strong>Total Paid:</strong> ₹${booking.totalAmount} (${booking.paymentStatus || 'PAID'})</p>
      </div>
      <p style="color: #71717a; font-size: 12px;">
        You can download your PDF Ticket with QR code anytime from the My Bookings section.
      </p>
    </div>
  `;

  try {
    const mailTransport = await getTransporter();
    await mailTransport.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        `"TicketBook Cinema" <${process.env.SMTP_USER || 'no-reply@ticketbook.dev'}>`,
      to: user.email,
      subject: `[TicketBook] Booking Confirmed: ${eventTitle} (${booking.bookingCode})`,
      html,
    });
    console.log(`\n📧 [Booking Confirmation Email Sent] To: ${user.email} | Code: ${booking.bookingCode}\n`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Confirmation email warning: ${err.message}`);
    return false;
  }
};

export const sendCancellationEmail = async ({ booking, user }) => {
  if (!user?.email || !booking) return false;

  const eventTitle = booking.event?.title || 'TicketBook Event';
  const seatsList = (booking.seatIds || []).join(', ');

  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; background: #09090b; color: #f4f4f5; padding: 36px; border-radius: 16px; max-width: 560px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="margin-bottom: 20px;">
        <span style="background: linear-gradient(135deg, #9333ea, #f43f5e); padding: 8px 14px; border-radius: 10px; font-weight: 800; color: #ffffff;">TICKETBOOK REFUND NOTICE</span>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 24px; color: #f43f5e;">Booking Cancelled</h2>
      <p style="color: #a1a1aa; font-size: 14px;">
        Hi <strong>${user.name || user.email}</strong>, your booking <strong>${booking.bookingCode}</strong> for <strong>${eventTitle}</strong> has been cancelled.
      </p>
      <div style="margin: 24px 0; padding: 20px; border-radius: 14px; background: #18181b; border: 1px solid #3f3f46;">
        <p style="margin: 4px 0; font-size: 14px; color: #d4d4d8;"><strong>Released Seats:</strong> ${seatsList}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #d4d4d8;"><strong>Original Amount Paid:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 12px 0 0; font-size: 16px; color: #10b981;"><strong>Refund Initiated:</strong> ₹${booking.refundAmount || 0} (${booking.refundPercentage || 0}%)</p>
      </div>
    </div>
  `;

  try {
    const mailTransport = await getTransporter();
    await mailTransport.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        `"TicketBook Cinema" <${process.env.SMTP_USER || 'no-reply@ticketbook.dev'}>`,
      to: user.email,
      subject: `[TicketBook] Cancellation & Refund Processed (${booking.bookingCode})`,
      html,
    });
    console.log(`\n📧 [Cancellation Email Sent] To: ${user.email} | Refund: ₹${booking.refundAmount}\n`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Cancellation email warning: ${err.message}`);
    return false;
  }
};
