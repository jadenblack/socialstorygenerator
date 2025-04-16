// Mock for auth-client.ts
const mockSignIn = {
    email: jest.fn().mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' } }, error: null }),
    social: jest.fn().mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' } }, error: null }),
};

const mockSignUp = {
    email: jest.fn().mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' } }, error: null }),
};

const mockSignOut = jest.fn().mockResolvedValue({ success: true });

const mockUseSession = jest.fn().mockReturnValue({
    data: { user: { id: '1', email: 'test@example.com' } },
    isPending: false,
});

const mockForgetPassword = jest.fn().mockResolvedValue({ data: {}, error: null });

const mockResetPassword = jest.fn().mockResolvedValue({ data: {}, error: null });

const mockSendVerificationEmail = jest.fn().mockResolvedValue({ success: true });

export const authClient = {
    useSession: mockUseSession,
};

export const signIn = mockSignIn;
export const signUp = mockSignUp;
export const signOut = mockSignOut;
export const forgetPassword = mockForgetPassword;
export const resetPassword = mockResetPassword;
export const sendVerificationEmail = mockSendVerificationEmail;

// This is a dummy test to prevent the "Your test suite must contain at least one test" error
describe('Auth Client Mock', () => {
    it('is a valid mock', () => {
        expect(true).toBe(true);
    });
}); 