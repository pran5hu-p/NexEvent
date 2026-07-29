import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { otpLimiter, getClientIp } from '@/lib/rateLimit';
import { emailQueue } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    try {
      await otpLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { message: 'Too many attempts, try again later' }, 
        { status: 429 }
      );
    }
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
    // Drop the job into Redis instead of sending the email directly
    await emailQueue.add('otp', {
      to: user.email,
      subject: 'Your Password Reset OTP',
      otp: otp // Passing the OTP data to the worker
    });

    return NextResponse.json({ message: 'If this email exists, an OTP was sent.' }, { status: 200 });

  } catch (error) {
    console.error('OTP Error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}