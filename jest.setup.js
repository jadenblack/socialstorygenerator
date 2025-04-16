// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder which is needed by Next.js but not available in Node.js
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
    usePathname: () => "",
    useSearchParams: () => ({
        get: jest.fn(),
    }),
}));

// Mock next/link component
jest.mock('next/link', () => {
    return ({ children, ...props }) => {
        return <a {...props}>{children}</a>;
    };
}); 