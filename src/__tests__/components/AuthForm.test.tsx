import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '@/app/components/AuthForm';
import { signIn, signUp } from '@/lib/auth-client';

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

describe('AuthForm Component', () => {
    describe('Login Mode', () => {
        beforeEach(() => {
            render(<AuthForm mode="login" />);
        });

        it('renders the login form correctly', () => {
            // Check for email and password fields
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

            // Check for login-specific elements
            expect(screen.getByText(/sign in/i)).toBeInTheDocument();
            expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
            expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();

            // Confirm signup-specific elements are not present
            expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
        });

        it('submits the login form with valid credentials', async () => {
            const user = userEvent.setup();

            // Fill in the form
            await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
            await user.type(screen.getByLabelText(/password/i), 'password123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /sign in/i }));

            // Check if the sign in function was called with correct arguments
            await waitFor(() => {
                expect(signIn.email).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                    callbackURL: expect.any(String)
                });
            });
        });

        it('handles Google sign in button click', async () => {
            const user = userEvent.setup();

            // Click the Google sign in button
            await user.click(screen.getByRole('button', { name: /continue with google/i }));

            // Check if the social sign in function was called
            await waitFor(() => {
                expect(signIn.social).toHaveBeenCalledWith({
                    provider: 'google',
                    callbackURL: expect.any(String)
                });
            });
        });
    });

    describe('Signup Mode', () => {
        beforeEach(() => {
            render(<AuthForm mode="signup" />);
        });

        it('renders the signup form correctly', () => {
            // Check for all signup fields
            expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

            // Check for signup-specific elements
            expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
            expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
        });

        it('validates passwords match before submission', async () => {
            const user = userEvent.setup();

            // Fill in the form with mismatched passwords
            await user.type(screen.getByLabelText(/name/i), 'Test User');
            await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
            await user.type(screen.getByLabelText(/^password$/i), 'password123');
            await user.type(screen.getByLabelText(/confirm password/i), 'different123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /sign up/i }));

            // Check for validation error
            expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();

            // Verify signup function was not called
            expect(signUp.email).not.toHaveBeenCalled();
        });

        it('submits the signup form with valid data', async () => {
            const user = userEvent.setup();

            // Fill in the form with valid data
            await user.type(screen.getByLabelText(/name/i), 'Test User');
            await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
            await user.type(screen.getByLabelText(/^password$/i), 'password123');
            await user.type(screen.getByLabelText(/confirm password/i), 'password123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /sign up/i }));

            // Check if signup function was called with correct data
            await waitFor(() => {
                expect(signUp.email).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User'
                });
            });
        });

        it('shows verification sent screen after successful signup', async () => {
            const user = userEvent.setup();

            // Fill in the form with valid data
            await user.type(screen.getByLabelText(/name/i), 'Test User');
            await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
            await user.type(screen.getByLabelText(/^password$/i), 'password123');
            await user.type(screen.getByLabelText(/confirm password/i), 'password123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /sign up/i }));

            // Check if verification sent screen appears
            expect(await screen.findByText(/verification email sent/i)).toBeInTheDocument();
            expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('displays error message when login fails', async () => {
            // Mock the sign in function to reject
            (signIn.email as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

            render(<AuthForm mode="login" />);
            const user = userEvent.setup();

            // Fill in and submit the form
            await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
            await user.type(screen.getByLabelText(/password/i), 'password123');
            await user.click(screen.getByRole('button', { name: /sign in/i }));

            // Check if error message is displayed
            expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
        });

        it('displays error message when signup fails', async () => {
            // Mock the sign up function to reject
            (signUp.email as jest.Mock).mockRejectedValueOnce(new Error('Email already exists'));

            render(<AuthForm mode="signup" />);
            const user = userEvent.setup();

            // Fill in the form with valid data
            await user.type(screen.getByLabelText(/name/i), 'Test User');
            await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
            await user.type(screen.getByLabelText(/^password$/i), 'password123');
            await user.type(screen.getByLabelText(/confirm password/i), 'password123');

            // Submit the form
            await user.click(screen.getByRole('button', { name: /sign up/i }));

            // Check if error message is displayed - use more flexible text match
            expect(await screen.findByText(/already registered|email already exists|already taken/i)).toBeInTheDocument();
        });
    });
}); 