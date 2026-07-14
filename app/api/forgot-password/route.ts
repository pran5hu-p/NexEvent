import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Security best practice: Don't reveal if an email exists or not
      return NextResponse.json({ message: 'If this email exists, an OTP was sent.' }, { status: 200 });
    }

    // 2. Generate a 6-digit OTP and set expiration (e.g., 10 minutes)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    // 3. Save OTP to database
    await prisma.user.update({
      where: { email: user.email },
      data: {
        resetOtp: otp,
        resetOtpExpiry: otpExpiry,
      },
    });

    // 4. Configure Nodemailer (You will need to add these to your .env file)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This must be an "App Password", not your normal password
      },
    });

    // 5. Send the email
    await transporter.sendMail({
      from: `"NexEvent Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Password Reset OTP',
      html: `
        <h2>Password Reset</h2>
        <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json({ message: 'If this email exists, an OTP was sent.' }, { status: 200 });

  } catch (error) {
    console.error('OTP Error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}