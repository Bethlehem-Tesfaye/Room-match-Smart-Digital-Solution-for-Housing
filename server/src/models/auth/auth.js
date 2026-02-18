import { betterAuth, logger } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import { openAPI } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { publishEmailJob } from "../../jobs/qstash.js";
import { env } from "../../config/evnironments.js";

// ✅ Mongo Client
const client = new MongoClient(env.DATABASE_URL);
await client.connect();
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client // enables transactions
  }),

  experimental: {
    joins: true
  },

  trustedOrigins: [
    env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4000"
  ].filter(Boolean),

  baseURL: env.BETTER_AUTH_BASE_URL || process.env.BETTER_AUTH_BASE_URL,

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      const html = `
        <p>Hi ${user.name ?? user.email},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <a href="${url}" style="display:inline-block;padding:10px 20px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px;">
          Reset Password
        </a>
        <p>If you did not request a password reset, you can ignore this email.</p>
      `;

      await publishEmailJob({
        type: "reset",
        to: user.email,
        subject: "Reset your password",
        html,
        token
      });
    }
  },

  emailVerification: {
    enabled: true,
    sendOnSignUp: true,

    sendVerificationEmail: async ({ user, url }) => {
      const html = `
        <p>Hello ${user.name ?? user.email},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${url}" style="display:inline-block;padding:10px 20px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px;">
          Verify Email
        </a>
      `;

      await publishEmailJob({
        type: "verification",
        to: user.email,
        subject: "Verify your email",
        html
      });
    },

    autoSignInAfterVerification: true,

    async afterEmailVerification(user) {
      logger.info(`${user.email} successfully verified!`);
    }
  },

  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    }
  },

  plugins: [openAPI()],

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const newUser = ctx.context.newSession?.user;

        if (newUser) {
          // ✅ Mongo version of profile creation
          await db
            .collection("profiles")
            .insertOne({
              userId: newUser.id,
              createdAt: new Date()
            })
            .catch(() => {});
        }
      }
    })
  },

  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    defaultCookieAttributes: {
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/"
    }
  },

  cookie: {
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    httpOnly: true,
    path: "/"
  }
});
