import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

const FROM = process.env.EMAIL_FROM || 'StaiAici <noreply@staiaici.ro>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    logger.error('Failed to send email', err, { to, subject });
  }
}

/** Wraps content in a professional email layout */
function emailLayout(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>StaiAici</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f5; padding: 40px 0; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 40px; }
    .content h2 { margin: 0 0 16px; font-size: 20px; color: #18181b; font-weight: 600; }
    .content p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #3f3f46; }
    .content p:last-child { margin-bottom: 0; }
    .btn { display: inline-block; padding: 14px 32px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .btn:hover { background: #4338ca; }
    .info-box { background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #71717a; font-size: 14px; }
    .info-value { color: #18181b; font-size: 14px; font-weight: 500; }
    .footer { padding: 24px 40px; background: #fafafa; text-align: center; border-top: 1px solid #e4e4e7; }
    .footer p { margin: 0; font-size: 13px; color: #a1a1aa; }
    .footer a { color: #4f46e5; text-decoration: none; }
    .signature { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e4e4e7; }
    .signature p { color: #71717a; font-size: 14px; }
    .muted { color: #71717a; font-size: 13px; }
    @media only screen and (max-width: 600px) {
      .container { margin: 0 16px; }
      .header, .content, .footer { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>StaiAici</h1>
      </div>
      <div class="content">
        ${content}
        <div class="signature">
          <p>Cu drag,<br><strong>Echipa StaiAici</strong></p>
        </div>
      </div>
      <div class="footer">
        <p><a href="${APP_URL}">staiaici.ro</a> — Platforma de cazare din Romania</p>
        <p style="margin-top: 8px;">Acest email a fost trimis automat. Te rugam sa nu raspunzi direct.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/auth/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verifica-ti adresa de email – StaiAici',
    html: emailLayout(`
      <h2>Bun venit, ${name}!</h2>
      <p>Multumim pentru inregistrare pe StaiAici. Pentru a-ti activa contul, te rugam sa-ti verifici adresa de email apasand pe butonul de mai jos.</p>
      <p style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verifica emailul</a>
      </p>
      <p class="muted">Linkul este valabil 24 de ore. Daca nu ai creat un cont pe StaiAici, ignora acest email.</p>
    `, `Verifica-ti emailul pentru a-ti activa contul StaiAici`),
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Resetare parola – StaiAici',
    html: emailLayout(`
      <h2>Salut, ${name}!</h2>
      <p>Am primit o cerere de resetare a parolei pentru contul tau. Apasa pe butonul de mai jos pentru a seta o parola noua.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reseteaza parola</a>
      </p>
      <p class="muted">Linkul este valabil 1 ora. Daca nu ai solicitat resetarea parolei, ignora acest email — contul tau ramane in siguranta.</p>
    `, `Reseteaza parola contului tau StaiAici`),
  });
}

export async function sendBookingRequestEmail(hostEmail: string, hostName: string, guestName: string, propertyTitle: string, startDate: string, endDate: string) {
  const dashboardUrl = `${APP_URL}/dashboard/host/bookings`;
  await sendEmail({
    to: hostEmail,
    subject: `Cerere noua de rezervare – ${propertyTitle}`,
    html: emailLayout(`
      <h2>Salut, ${hostName}!</h2>
      <p>Ai primit o cerere noua de rezervare. Iata detaliile:</p>
      <div class="info-box">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #71717a;">Proprietate</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${propertyTitle}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Oaspete</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${guestName}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Check-in</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${startDate}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Check-out</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${endDate}</td></tr>
        </table>
      </div>
      <p>Intra in dashboard pentru a accepta sau refuza cererea.</p>
      <p style="text-align: center;">
        <a href="${dashboardUrl}" class="btn">Vezi rezervarile</a>
      </p>
    `, `${guestName} a trimis o cerere de rezervare pentru ${propertyTitle}`),
  });
}

export async function sendBookingAcceptedEmail(guestEmail: string, guestName: string, propertyTitle: string, startDate: string, endDate: string, hostName: string, hostPhone?: string) {
  const dashboardUrl = `${APP_URL}/dashboard/guest/bookings`;
  await sendEmail({
    to: guestEmail,
    subject: `Rezervarea ta a fost acceptata! – ${propertyTitle}`,
    html: emailLayout(`
      <h2>Vesti bune, ${guestName}!</h2>
      <p>Rezervarea ta a fost <strong style="color: #16a34a;">acceptata</strong>. Pregateste-te de calatorie!</p>
      <div class="info-box">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #71717a;">Proprietate</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${propertyTitle}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Check-in</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${startDate}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Check-out</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${endDate}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Gazda</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${hostName}${hostPhone ? ` (${hostPhone})` : ''}</td></tr>
        </table>
      </div>
      <p>Verifica detaliile rezervarii in dashboard pentru instructiunile de check-in si informatii despre locatie.</p>
      <p style="text-align: center;">
        <a href="${dashboardUrl}" class="btn">Vezi rezervarea</a>
      </p>
    `, `Rezervarea ta pentru ${propertyTitle} a fost acceptata`),
  });
}

export async function sendBookingRejectedEmail(guestEmail: string, guestName: string, propertyTitle: string, startDate: string, endDate: string) {
  const searchUrl = `${APP_URL}/search`;
  await sendEmail({
    to: guestEmail,
    subject: `Rezervarea ta a fost refuzata – ${propertyTitle}`,
    html: emailLayout(`
      <h2>Salut, ${guestName}</h2>
      <p>Din pacate, rezervarea ta pentru <strong>${propertyTitle}</strong> a fost <strong style="color: #dc2626;">refuzata</strong> de gazda.</p>
      <div class="info-box">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #71717a;">Proprietate</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${propertyTitle}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Perioada</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${startDate} – ${endDate}</td></tr>
        </table>
      </div>
      <p>Nu-ti face griji! Poti gasi alte proprietati disponibile pe platforma noastra.</p>
      <p style="text-align: center;">
        <a href="${searchUrl}" class="btn">Cauta alte cazari</a>
      </p>
    `, `Rezervarea pentru ${propertyTitle} a fost refuzata`),
  });
}

export async function sendReviewReminderEmail(guestEmail: string, guestName: string, propertyTitle: string, bookingId: string) {
  const reviewUrl = `${APP_URL}/dashboard/guest/bookings/${bookingId}`;
  await sendEmail({
    to: guestEmail,
    subject: `Cum a fost sejurul la ${propertyTitle}?`,
    html: emailLayout(`
      <h2>Salut, ${guestName}!</h2>
      <p>Speram ca ai avut un sejur placut la <strong>${propertyTitle}</strong>!</p>
      <p>Ne-ar ajuta foarte mult daca ai lasa o recenzie despre experienta ta. Feedback-ul tau ii ajuta pe alti calatori sa aleaga cazarea potrivita, iar gazda va aprecia opinia ta.</p>
      <p style="text-align: center;">
        <a href="${reviewUrl}" class="btn">Lasa o recenzie</a>
      </p>
      <p class="muted">Multumim ca faci parte din comunitatea StaiAici!</p>
    `, `Lasa o recenzie pentru ${propertyTitle}`),
  });
}

export async function sendCheckInReminderEmail(
  guestEmail: string,
  guestName: string,
  propertyTitle: string,
  propertyAddress: string,
  checkInDate: string,
  hostName: string,
  hostPhone: string | null,
  checkInInfo: string | null,
  bookingId: string
) {
  const bookingUrl = `${APP_URL}/dashboard/guest/bookings/${bookingId}`;
  await sendEmail({
    to: guestEmail,
    subject: `Reminder: Check-in maine la ${propertyTitle}`,
    html: emailLayout(`
      <h2>Salut, ${guestName}!</h2>
      <p>Iti reamintim ca maine este ziua de <strong>check-in</strong> la <strong>${propertyTitle}</strong>.</p>
      <div class="info-box">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #71717a;">Data check-in</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${checkInDate}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Adresa</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${propertyAddress}</td></tr>
          <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Gazda</td><td style="padding: 8px 0; text-align: right; font-weight: 500; color: #18181b;">${hostName}${hostPhone ? ` (${hostPhone})` : ''}</td></tr>
        </table>
      </div>
      ${checkInInfo ? `
      <p><strong>Instructiuni de check-in:</strong></p>
      <p style="background: #fafafa; padding: 16px; border-radius: 8px; font-size: 14px; white-space: pre-line;">${checkInInfo}</p>
      ` : ''}
      <p>Daca ai intrebari, poti contacta gazda prin sectiunea de mesaje din dashboard.</p>
      <p style="text-align: center;">
        <a href="${bookingUrl}" class="btn">Vezi detalii rezervare</a>
      </p>
      <p class="muted">Calatorie placuta!</p>
    `, `Maine este check-in la ${propertyTitle}`),
  });
}
