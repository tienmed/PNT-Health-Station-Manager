import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                const email = user.email;
                if (email && email.endsWith("@pnt.edu.vn")) {
                    return true;
                }
                return false;
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user?.email) {
                try {
                    // Dynamic Import to avoid build/circular dependency issues
                    const { getUserByEmail } = await import("./sheets");
                    const dbUser = await getUserByEmail(session.user.email);

                    // If user is in the sheet, use that role (ADMIN/STAFF)
                    if (dbUser && dbUser.role) {
                        (session.user as any).role = dbUser.role.toUpperCase();
                    }
                    // If not in sheet but valid domain, default to EMPLOYEE
                    else if (session.user.email.endsWith("@pnt.edu.vn")) {
                        (session.user as any).role = "EMPLOYEE";
                    }
                } catch (e) {
                    console.error("Role assignment error", e);
                    // Fallback safe default
                    if (session.user.email.endsWith("@pnt.edu.vn")) {
                        (session.user as any).role = "EMPLOYEE";
                    }
                }
            }
            return session;
        },
    },
    pages: {
        // signIn: "/auth/signin", // Custom sign-in page if we want, or default
        error: "/auth/error", // Error page
    },
    session: {
        maxAge: 90 * 24 * 60 * 60, // 3 months
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// handler export removed, options only
