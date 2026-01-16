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
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user && user.email) {
                try {
                    const { getUserByEmail } = await import("./sheets");
                    const dbUser = await getUserByEmail(user.email);

                    if (dbUser) {
                        token.role = dbUser.role?.toUpperCase();
                        token.phone = dbUser.phone;
                        token.unit = dbUser.unit;
                    } else if (user.email.endsWith("@pnt.edu.vn")) {
                        token.role = "EMPLOYEE";
                    }
                } catch (e) {
                    console.error("JWT assignment error", e);
                    if (user.email.endsWith("@pnt.edu.vn")) {
                        token.role = "EMPLOYEE";
                    }
                }
            }

            // Trigger update (when client calls update())
            if (trigger === "update" && session) {
                // If the update contains specific fields, update token
                // Or re-fetch from DB to be sure? 
                // Let's trust the client provided data for instant feedback OR re-fetch.
                // Re-fetching is safer.
                if (token.email) {
                    try {
                        const { getUserByEmail } = await import("./sheets");
                        const dbUser = await getUserByEmail(token.email);
                        if (dbUser) {
                            token.role = dbUser.role?.toUpperCase();
                            token.phone = dbUser.phone;
                            token.unit = dbUser.unit;
                        }
                    } catch (e) {
                        console.error("JWT update error", e);
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.phone = token.phone;
                session.user.unit = token.unit;
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
