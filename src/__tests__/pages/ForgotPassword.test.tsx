import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/forgot-password/page';
import { forgetPassword } from '@/lib/auth-client';

// Mock the auth-client module
jest.mock('@/lib/auth-client', () => require('../../__tests__/__mocks__/auth-client'));

// Mock console methods to reduce test noise
beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('ForgotPassword Page', () => {
    beforeEach(() => {
        render(<ForgotPasswordPage />);
    });

    it('renders the forgot password form correctly', () => {
        // Check for title and description
        expect(screen.getByRole('heading', { name: /forgot your password/i })).toBeInTheDocument();
        expect(screen.getByText(/enter your email address below/i)).toBeInTheDocument();

        // Check for email input
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

        // Check for submit button
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();

        // Check for login link
        expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });

    it('submits the form with valid email', async () => {
        const user = userEvent.setup();

        // Fill in the email
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');

        // Submit the form
        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        // Check if the forget password function was called with correct arguments
        await waitFor(() => {
            expect(forgetPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                redirectTo: expect.any(String)
            });
        });
    });

    it('shows success message after form submission', async () => {
        const user = userEvent.setup();

        // Fill in the email
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');

        // Submit the form
        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        // Check for success message
        expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
        expect(screen.getByText(/we've sent a password reset link to test@example.com/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
    });

    it('displays error message when reset fails', async () => {
        // Mock the forget password function to reject
        (forgetPassword as jest.Mock).mockRejectedValueOnce(new Error('Email not found'));

        const user = userEvent.setup();

        // Fill in the email
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');

        // Submit the form
        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        // Check for error message
        expect(await screen.findByText(/email not found/i)).toBeInTheDocument();
    });
}); 