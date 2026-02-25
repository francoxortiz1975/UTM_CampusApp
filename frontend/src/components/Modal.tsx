'use client'

import { ReactNode } from "react"

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    onSubmit?: () => void | Promise<void>;
    submitLabel?: string;
};

export default function Modal({isOpen, onClose, title, children, onSubmit, submitLabel}: ModalProps) {
    if (!isOpen) return null;

    const handleSubmit = async () => {
        try {
            if (onSubmit) {
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
            <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 z-12">
                {title && (
                    <h2 className="text-lg font-semibold text-black mb-4">{title}</h2>
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
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm text-white rounded-lg bg-purple-600 hover:bg-purple-700"
                    >
                        {submitLabel ?? "Submit"}
                    </button>
                </div>
            </div>
        </div>
    )
}
