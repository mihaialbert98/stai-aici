import nodemailer from 'nodemailer';

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

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[Email] Failed to send:', err);
  }
}

export async function sendBookingRequestEmail(hostEmail: string, hostName: string, guestName: string, propertyTitle: string, startDate: string, endDate: string) {
  await sendEmail({
    to: hostEmail,
    subject: `Cerere nouă de rezervare – ${propertyTitle}`,
    html: `
      <h2>Salut ${hostName},</h2>
      <p><strong>${guestName}</strong> a trimis o cerere de rezervare pentru <strong>${propertyTitle}</strong>.</p>
      <p>Perioada: <strong>${startDate}</strong> – <strong>${endDate}</strong></p>
      <p>Intră în dashboard pentru a accepta sau refuza cererea.</p>
      <br/>
      <p>— Echipa StaiAici</p>
    `,
  });
}

export async function sendBookingAcceptedEmail(guestEmail: string, guestName: string, propertyTitle: string, startDate: string, endDate: string) {
  await sendEmail({
    to: guestEmail,
    subject: `Rezervarea ta a fost acceptată – ${propertyTitle}`,
    html: `
      <h2>Salut ${guestName},</h2>
      <p>Vești bune! Rezervarea ta pentru <strong>${propertyTitle}</strong> a fost <strong>acceptată</strong>.</p>
      <p>Perioada: <strong>${startDate}</strong> – <strong>${endDate}</strong></p>
      <p>Verifică detaliile rezervării în dashboard pentru instrucțiunile de check-in.</p>
      <br/>
      <p>— Echipa StaiAici</p>
    `,
  });
}

export async function sendBookingRejectedEmail(guestEmail: string, guestName: string, propertyTitle: string, startDate: string, endDate: string) {
  await sendEmail({
    to: guestEmail,
    subject: `Rezervarea ta a fost refuzată – ${propertyTitle}`,
    html: `
      <h2>Salut ${guestName},</h2>
      <p>Din păcate, rezervarea ta pentru <strong>${propertyTitle}</strong> a fost <strong>refuzată</strong> de gazdă.</p>
      <p>Perioada: <strong>${startDate}</strong> – <strong>${endDate}</strong></p>
      <p>Poți căuta alte proprietăți disponibile pe platformă.</p>
      <br/>
      <p>— Echipa StaiAici</p>
    `,
  });
}
