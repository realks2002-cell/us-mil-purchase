import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SESSION_MAX_AGE = 8 * 60 * 60; // 8시간
const ROLE_REFRESH_INTERVAL = 5 * 60; // 5분마다 DB에서 role 재조회

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) return null;

        try {
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));
        } catch {
          // lastLoginAt 업데이트 실패해도 로그인은 허용
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
        token.roleCheckedAt = Date.now();
      }

      // 주기적으로 DB에서 role/isActive 재조회
      const lastChecked = (token.roleCheckedAt as number) || 0;
      if (Date.now() - lastChecked > ROLE_REFRESH_INTERVAL * 1000) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, token.id as string),
            columns: { role: true, isActive: true },
          });
          if (!dbUser || !dbUser.isActive) {
            // 비활성 사용자 → 토큰 무효화
            return { ...token, id: "", role: "" };
          }
          token.role = dbUser.role;
          token.roleCheckedAt = Date.now();
        } catch {
          // DB 오류 시 기존 토큰 유지
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
});
