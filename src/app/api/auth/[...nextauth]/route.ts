import NextAuth, { NextAuthOptions } from 'next-auth';
import LineProvider from 'next-auth/providers/line';

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        // Line profile returns 'sub' as the line user id
        token.lineUserId = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add lineUserId to session
        (session.user as any).id = token.lineUserId;
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
