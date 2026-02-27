'use client'

import { ReactNode } from "react"

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;

    // Optional submit handler
    onSubmit?: () => void | Promise<void>;

    // Primary button customization
    primaryButtonText?: string;
    primaryButtonOnClick?: () => void | Promise<void>;
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    onSubmit,
    primaryButtonText = "Submit",
    primaryButtonOnClick
}: ModalProps) {

    if (!isOpen) return null;

    const handlePrimaryClick = async () => {
        try {
            if (primaryButtonOnClick) {
                await primaryButtonOnClick();
            } else if (onSubmit) {
                await onSubmit();
            }
        } finally {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 z-50">
                {title && (
                    <h2 className="text-lg font-semibold text-black mb-4">
                        {title}
                    </h2>
                )}

                {children}

                <div className="mt-6 flex justify-between">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-black rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                        Close
                    </button>

                    <button 
                        onClick={handlePrimaryClick}
                        className="px-4 py-2 text-sm text-white rounded-lg bg-purple-600 hover:bg-purple-700"
                    >
                        {primaryButtonText}
                    </button>
                </div>
            </div>
        </div>
    )
}
