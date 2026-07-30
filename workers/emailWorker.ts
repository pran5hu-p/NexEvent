import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import http from 'http';
// Dedicated BullMQ-safe connection:
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
});

const PORT = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Worker is running');
}).listen(PORT, () => {
  console.log(`Dummy health-check server listening on port ${PORT}`);
});

// 1. Set up the email transporter outside the worker so it gets reused
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This must be your Google App Password
  },
});

const worker = new Worker(
  'emails',
  async (job) => {
    console.log(`--> Processing job: ${job.name} (ID: ${job.id})`);
    
    switch (job.name) {
      case 'otp':
        // 2. Actually send the email using the data passed from Next.js
        await transporter.sendMail({
          from: `"NexEvent Security" <${process.env.EMAIL_USER}>`,
          to: job.data.to,
          subject: job.data.subject,
          html: `
            <h2>Password Reset</h2>
            <p>Your One-Time Password (OTP) is: <strong>${job.data.otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          `,
        });
        console.log(`✉️ Actual OTP email successfully sent to: ${job.data.to}`);
        break;
        
      case 'event-status':
        // This runs when an Admin approves or rejects an Organizer's event
        await transporter.sendMail({
          from: `"NexEvent Admin" <${process.env.EMAIL_USER}>`,
          to: job.data.to,
          subject: `Update on your event: ${job.data.eventTitle}`,
          html: `
            <h2>Event Status Update</h2>
            <p>Hello,</p>
            <p>The status of your event <strong>${job.data.eventTitle}</strong> has been updated to: <span style="text-transform: uppercase; font-weight: bold;">${job.data.status}</span>.</p>
            <p>If you have any questions, please contact the admin team.</p>
          `,
        });
        console.log(`✉️ Event status email successfully sent to: ${job.data.to}`);
        break;
        
      case 'event-reminder':
        const { eventId, eventTitle } = job.data;
        
        // 1. Fetch everyone who has a "registered" ticket for this specific event
        const registrations = await prisma.registration.findMany({
          where: { eventId: eventId, status: 'registered' },
          include: { 
            user: true, 
            event: true 
          }
        });
        
        // 2. Loop through and send the reminder email
        for (const reg of registrations) {
          if (reg.user?.email) {
            await transporter.sendMail({
              from: `"NexEvent Updates" <${process.env.EMAIL_USER}>`,
              to: reg.user.email,
              subject: `Reminder: ${eventTitle} is happening tomorrow!`,
              html: `
                <h2>Event Reminder</h2>
                <p>Hi ${reg.user?.name || 'there'},</p>
                <p>This is a quick reminder that <strong>${eventTitle}</strong> is happening tomorrow at <strong>${reg.event.location}</strong>.</p>
                <p>Log in to your dashboard to view your ticket.</p>
                <p>See you there!</p>
              `,
            });
          }
        }
        console.log(`✉️ Sent ${registrations.length} reminder emails for event: ${eventTitle}`);
        break;
      case 'ticket-confirmation':
        await transporter.sendMail({
          from: `"NexEvent Tickets" <${process.env.EMAIL_USER}>`,
          to: job.data.to,
          subject: `Your Ticket Confirmed: ${job.data.eventTitle}`,
          html: `
            <h2>You're going to ${job.data.eventTitle}!</h2>
            <p>Hi ${job.data.userName},</p>
            <p>Your registration is confirmed. Here are the details:</p>
            <ul>
              <li><strong>Date:</strong> ${new Date(job.data.eventDate).toLocaleString()}</li>
              <li><strong>Location:</strong> ${job.data.eventLocation}</li>
            </ul>
            <p>See you there!</p>
          `,
        });
        console.log(`✉️ Ticket confirmation sent to: ${job.data.to}`);
        break;
    }
  },
  { connection: redis }
);

worker.on('completed', (job) => {
  console.log(`✓ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`✕ Job ${job?.id} failed: ${err.message}`);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('👷 Email worker is running with Nodemailer enabled...');