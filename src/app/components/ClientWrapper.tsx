'use client';

import { Suspense, ReactNode } from 'react';

interface ClientWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export default function ClientWrapper({ children, fallback = <div>Loading...</div> }: ClientWrapperProps) {
    return (
        <Suspense fallback={fallback}>
            {children}
        </Suspense>
    );
} 