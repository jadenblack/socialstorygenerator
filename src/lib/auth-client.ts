import { createAuthClient } from "better-auth/react";

// Log the available environment variables for debugging
console.log('Auth Client Environment Variables:');
console.log('NEXT_PUBLIC_AUTH_API_URL:', process.env.NEXT_PUBLIC_AUTH_API_URL);
console.log('NEXT_PUBLIC_BETTER_AUTH_URL:', process.env.NEXT_PUBLIC_BETTER_AUTH_URL);

// Make sure we have a string URL, not an object
const baseURL = typeof process.env.NEXT_PUBLIC_AUTH_API_URL === 'string'
  ? process.env.NEXT_PUBLIC_AUTH_API_URL
  : 'http://localhost:3000/api/auth';

console.log('Using baseURL:', baseURL);

export const authClient = createAuthClient({
  baseURL
});

// Export commonly used methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  sendVerificationEmail,
  forgetPassword,
  resetPassword
} = authClient;