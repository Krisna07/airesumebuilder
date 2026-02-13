'use client'
import { useEffect, useState, createContext, useContext, useCallback, useMemo } from "react";
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
    clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Renders children AND a portal-based toast layer so z-index isn't trapped by parent stacking contexts.
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string = '', type: ToastType = 'info', duration: number = 4000) => {
        if (!message) return;
        setToasts(prev => {
            const isDuplicate = prev.some(t => t.message === message && t.type === type);
            if (isDuplicate) return prev; // Return existing state, NO re-render triggered

        const id = Math.random().toString(36).substring(2, 9);
            const newToast = { id, message, type, duration };

        if (duration > 0) {
            setTimeout(() => {
                hideToast(id);
            }, duration);
        }

            return [...prev, newToast];
        });
    }, [hideToast])

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const value = useMemo(() => ({ toasts, showToast, hideToast, clearAllToasts }), [toasts, showToast, hideToast, clearAllToasts]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {mounted && createPortal(<ToastContainer />, document.body)}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast Container Component
function ToastContainer() {
    const { toasts, hideToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
            ))}
        </div>
    );
}

// Individual Toast Item Component
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for animation to complete before removing
        setTimeout(onClose, 300);
    };

    const getToastStyles = () => {
    const baseStyles = "pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 ease-in-out relative z-[1]";
        const visibilityStyles = isVisible 
            ? "translate-x-0 opacity-100" 
            : "translate-x-full opacity-0";

        switch (toast.type) {
            case 'success':
                return `${baseStyles} ${visibilityStyles} bg-green-100 border-l-4 border-green-500 text-green-700`;
            case 'error':
                return `${baseStyles} ${visibilityStyles} bg-red-100 border-l-4 border-red-500 text-red-700`;
            case 'warning':
                return `${baseStyles} ${visibilityStyles} bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700`;
            case 'info':
            default:
                return `${baseStyles} ${visibilityStyles} bg-blue-100 border-l-4 border-blue-500 text-blue-700`;
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <div className={getToastStyles()}>
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 text-lg font-bold">
                    {getIcon()}
                </div>
                <div className="flex-1 text-sm font-medium">
                    {toast.message}
                </div>
            </div>
            <button
                onClick={handleClose}
                className="ml-4 text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close toast"
            >
                ×
            </button>
        </div>
    );
}