import React from 'react';
import { render, screen } from '@testing-library/react';
import AppLayout from '@/app/(app)/layout';
import { authClient } from '@/lib/auth-client';

// Mock the auth-client module
jest.mock('@/lib/auth-client', () => require('../../__tests__/__mocks__/auth-client'));

// Mock Link component to make testing easier
jest.mock('next/link', () => {
    return ({ children, href, ...rest }: { children: React.ReactNode, href: string }) => (
        <a href={href} {...rest} data-testid={`link-to-${href.replace(/\//g, '-')}`}>
            {children}
        </a>
    );
});

describe('AppLayout Component', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('shows Upload link when user is authenticated', () => {
        // Mock useSession to return an authenticated user
        (authClient.useSession as jest.Mock).mockReturnValueOnce({
            data: { user: { id: '1', email: 'test@example.com' } },
            isPending: false,
        });

        render(<AppLayout>Test Content</AppLayout>);

        // Check that Upload link is visible
        expect(screen.getByTestId('link-to--upload')).toBeInTheDocument();
        expect(screen.getByText('Upload')).toBeInTheDocument();

        // Check that the user's email is shown
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('hides Upload link when user is not authenticated', () => {
        // Mock useSession to return no user
        (authClient.useSession as jest.Mock).mockReturnValueOnce({
            data: null,
            isPending: false,
        });

        render(<AppLayout>Test Content</AppLayout>);

        // Check that Upload link is not visible
        expect(screen.queryByTestId('link-to--upload')).not.toBeInTheDocument();
        expect(screen.queryByText('Upload')).not.toBeInTheDocument();

        // Check that "Sign in" text is shown instead of email
        expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('shows loading spinner while checking authentication', () => {
        // Mock useSession to return isPending true
        (authClient.useSession as jest.Mock).mockReturnValueOnce({
            data: null,
            isPending: true,
        });

        render(<AppLayout>Test Content</AppLayout>);

        // Upload link should not be visible while loading
        expect(screen.queryByTestId('link-to--upload')).not.toBeInTheDocument();
        expect(screen.queryByText('Upload')).not.toBeInTheDocument();
    });

    it('renders children correctly', () => {
        (authClient.useSession as jest.Mock).mockReturnValueOnce({
            data: { user: { id: '1', email: 'test@example.com' } },
            isPending: false,
        });

        render(<AppLayout>
            <div data-testid="test-content">Test Content</div>
        </AppLayout>);

        // Check that children are rendered
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
}); 