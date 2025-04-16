import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '@/app/reset-password/page';
import { resetPassword } from '@/lib/auth-client';
import { useSearchParams } from 'next/navigation';

// Mock the auth-client module
jest.mock('@/lib/auth-client', () => require('../../__tests__/__mocks__/auth-client'));

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
    ...jest.requireActual('next/navigation'),
    useSearchParams: jest.fn(),
}));

// Mock console methods to reduce test noise
beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('ResetPassword Page', () => {
    describe('with valid token', () => {
        beforeEach(() => {
            // Mock the useSearchParams to return a valid token
            (useSearchParams as jest.Mock).mockReturnValue({
                get: jest.fn().mockReturnValue('valid-token')
            });

            render(<ResetPasswordPage />);
        });

        it('renders the reset password form correctly', () => {
            // Check for title and description
            expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
            expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();

            // Check for password inputs
            expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

            // Check for submit button
            expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();

            // Check for login link
            expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
        });

        it('validates passwords match before submission', async () => {
            const user = userEvent.setup();

            // Fill in the form with mismatched passwords
            await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
            await user.type(screen.getByLabelText(/confirm password/i), 'different123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /reset password/i }));

            // Check for validation error
            expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();

            // Verify resetPassword function was not called
            expect(resetPassword).not.toHaveBeenCalled();
        });

        it('validates password length', async () => {
            const user = userEvent.setup();

            // Fill in the form with a short password
            await user.type(screen.getByLabelText(/new password/i), 'short');
            await user.type(screen.getByLabelText(/confirm password/i), 'short');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /reset password/i }));

            // Check for validation error
            expect(await screen.findByText(/password must be at least 8 characters long/i)).toBeInTheDocument();

            // Verify resetPassword function was not called
            expect(resetPassword).not.toHaveBeenCalled();
        });

        it('submits the form with valid passwords', async () => {
            const user = userEvent.setup();

            // Fill in the form with valid passwords
            await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
            await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /reset password/i }));

            // Check if resetPassword was called with correct arguments
            await waitFor(() => {
                expect(resetPassword).toHaveBeenCalledWith({
                    newPassword: 'newpassword123',
                    token: 'valid-token'
                });
            });
        });

        it('shows success message after password reset', async () => {
            const user = userEvent.setup();

            // Fill in the form with valid passwords
            await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
            await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /reset password/i }));

            // Check for success message
            expect(await screen.findByText(/password reset complete/i)).toBeInTheDocument();
            expect(screen.getByText(/your password has been successfully reset/i)).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
        });
    });

    describe('with invalid or missing token', () => {
        beforeEach(() => {
            // Mock the useSearchParams to return null token
            (useSearchParams as jest.Mock).mockReturnValue({
                get: jest.fn().mockReturnValue(null)
            });

            render(<ResetPasswordPage />);
        });

        it('displays error message when token is missing', () => {
            // Check for error message
            expect(screen.getByText(/invalid or missing token/i)).toBeInTheDocument();

            // Submit button should be disabled
            expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
        });
    });

    it('displays error message when reset fails', async () => {
        // Mock the useSearchParams to return a valid token
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn().mockReturnValue('valid-token')
        });

        // Mock resetPassword to reject
        (resetPassword as jest.Mock).mockRejectedValueOnce(new Error('Invalid or expired token'));

        render(<ResetPasswordPage />);
        const user = userEvent.setup();

        // Fill in the form with valid passwords
        await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
        await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');

        // Submit the form
        await user.click(screen.getByRole('button', { name: /reset password/i }));

        // Check for error message
        expect(await screen.findByText(/invalid or expired token/i)).toBeInTheDocument();
    });
}); 