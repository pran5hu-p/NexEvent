import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { authLimiter } from '@/lib/rateLimit';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      avatarUrl?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
  interface User {
    id: string;
    role: string;
    avatarUrl?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    avatarUrl?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        const email = credentials.email.toLowerCase();

        // 1. Consume a point for this specific email address
        try {
          await authLimiter.consume(email);
        } catch {
          throw new Error('Too many login attempts. Please try again in 15 minutes.');
        }

        // 2. Look up the user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        // 3. Check if the user's account is suspended
        if (user.isBlocked) {
          throw new Error('Your account has been suspended');
        }

        // 4. Verify the password match
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Incorrect password');
        }

        // Return user object to pass down into JWT tokens
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl, // Added this so it actually passes to the JWT callback!
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt', 
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl; 
      }
      
      // Catch the update trigger from ProfileEditor
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.avatarUrl) token.avatarUrl = session.avatarUrl;
        if (session.image) token.picture = session.image; 
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string;
        // Map standard NextAuth image field if needed for built-in components
        session.user.image = (token.avatarUrl || token.picture) as string; 
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};