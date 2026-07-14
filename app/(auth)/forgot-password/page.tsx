'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Step 1: Send the Email ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

      toast.success('OTP sent to your email!', {
        style: { background: '#333', color: '#fff' },
      });
      setStep(2); // Move to the next visual step

    } catch (error: any) {
      toast.error(error.message, { style: { background: '#333', color: '#fff' } });
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Verify and Reset ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      toast.success('Password reset successfully! You can now log in.', {
        style: { background: '#333', color: '#fff' },
        duration: 4000,
      });
      
      router.push('/login');

    } catch (error: any) {
      toast.error(error.message, { style: { background: '#333', color: '#fff' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 font-sans text-neutral-200">
      <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none flex justify-center">
        <div className="absolute top-[-20%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 bg-neutral-900/60 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {step === 1 ? 'Reset Password' : 'Enter OTP'}
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {step === 1 
              ? "Enter your email to receive a 6-digit recovery code." 
              : `We sent a code to ${formData.email}`}
          </p>
        </div>

        {/* --- FORM STEP 1: REQUEST OTP --- */}
        {step === 1 && (
          <form className="mt-8 space-y-5" onSubmit={handleRequestOtp}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition-colors sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Sending code...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {/* --- FORM STEP 2: VERIFY OTP & NEW PASSWORD --- */}
        {step === 2 && (
          <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-neutral-300">
                6-Digit OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                value={formData.otp}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition-colors sm:text-sm text-center"
                placeholder="------"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-300">
                New Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="block w-full pl-4 pr-12 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition-colors sm:text-sm"
                  placeholder="••••••••"
                />
                
                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Verifying...' : 'Set New Password'}
            </button>
          </form>
        )}

        <div className="text-center text-sm text-neutral-400">
          Remembered your password?{' '}
          <Link href="/login" className="font-medium text-white hover:text-neutral-300 transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}