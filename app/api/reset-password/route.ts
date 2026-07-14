import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // 1. Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    // 2. Verify the OTP matches
    if (user.resetOtp !== otp) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    // 3. Check if the OTP has expired (past the 10-minute mark)
    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return NextResponse.json(
        { message: 'OTP has expired. Please request a new one.' }, 
        { status: 400 }
      );
    }

    // 4. Hash the brand new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update the password AND wipe the OTP fields clean
    await prisma.user.update({
      where: { email: user.email },
      data: {
        password: hashedPassword,
        resetOtp: null,       // Crucial: clears the code so it can't be reused
        resetOtpExpiry: null, // Crucial: clears the expiration date
      },
    });

    return NextResponse.json(
      { message: 'Password reset successfully' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json(
      { message: 'An error occurred during password reset' }, 
      { status: 500 }
    );
  }
}