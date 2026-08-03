import NextAuth, { NextAuthOptions } from 'next-auth';
import LineProvider from 'next-auth/providers/line';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (profile) {
        // 'sub' is the unique identifier for both LINE and Google
        token.userId = profile.sub || token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add userId to session
        (session.user as any).id = token.userId || token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
