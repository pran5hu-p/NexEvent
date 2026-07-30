import nodemailer from 'nodemailer';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use host, port, auth for other providers
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendTicketConfirmationEmail({
  toEmail,
  userName,
  eventTitle,
  eventDate,
  eventLocation,
}: {
  toEmail: string;
  userName: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
}) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Skipping email: Email credentials not set.');
      return;
    }

    await transporter.sendMail({
      from: `"NexEvent" <${process.env.EMAIL_USER}>`,
      to: toEmail, // Now it can send to ANY customer email address!
      subject: `Ticket Confirmed: ${eventTitle}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 30px; border-radius: 12px;">
          <h2 style="color: #22c55e; margin-bottom: 10px;">You're Registered!</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your spot for <strong>${eventTitle}</strong> has been successfully secured.</p>
          
          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #333;">
            <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
            <p style="margin: 5px 0;">📍 <strong>Location:</strong> ${eventLocation}</p>
          </div>

          <p>You can view your entry QR code anytime by visiting your <a href="${appUrl}/dashboard/user" style="color: #22c55e; text-decoration: underline;">User Ticket Dashboard</a>.</p>
          
          <p style="color: #737373; font-size: 12px; margin-top: 30px;">See you at the event!<br/>- The NexEvent Team</p>
        </div>
      `,
    });
    
    console.log(`Confirmation email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error('Failed to send confirmation email via Nodemailer:', error);
  }
}