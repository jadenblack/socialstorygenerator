import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import nodemailer from "nodemailer";

// Print loaded environment variables for debugging
console.log('Auth Configuration:');
console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
console.log('NEXT_PUBLIC_BETTER_AUTH_URL:', process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
console.log('MongoDB URI set:', !!process.env.MONGODB_URI);
console.log('SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER,
  passSet: !!process.env.SMTP_PASS
});

// Make sure we have proper URL values
const verificationEmailRedirectURL = typeof process.env.NEXT_PUBLIC_BETTER_AUTH_URL === 'string'
  ? `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/verify-email`
  : 'http://localhost:3000/verify-email';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

// Setup email transporter
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

// Create transporter with detailed error logging
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT!),
  secure: SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  debug: true // Enable debugging
});

// Test SMTP connection
transporter.verify(function (error) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Helper function to send emails
const sendEmail = async (options: { to: string; subject: string; text: string; html?: string }) => {
  try {
    console.log(`Attempting to send email to ${options.to}`);

    const mailOptions = {
      from: `"Social Story Generator" <${SMTP_USER}>`,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}, message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

// Create better-auth instance
export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token },) => {
      // Ensure URL is a string
      const resetUrl = typeof url === 'string' ? url : `${verificationEmailRedirectURL}?token=${token}`;
      console.log(`Sending password reset email to ${user.email}, URL: ${resetUrl}`);

      await sendEmail({
        to: user.email,
        subject: "Reset Your Password - Social Story Generator",
        text: `Click the link to reset your password: ${resetUrl}`,
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `
      });
    }
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      // Ensure URL is a string
      const verificationUrl = typeof url === 'string' ? url : `${verificationEmailRedirectURL}?token=${token}`;
      console.log(`Sending verification email to ${user.email}, URL: ${verificationUrl}`);

      const result = await sendEmail({
        to: user.email,
        subject: "Verify Your Email - Social Story Generator",
        text: `Click the link to verify your email: ${verificationUrl}`,
        html: `
          <h2>Email Verification</h2>
          <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Verify Email</a>
        `
      });

      if (!result.success) {
        console.error("Failed to send verification email:", result.error);
      }
    },
    verificationEmailRedirectURL
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  }
}); 