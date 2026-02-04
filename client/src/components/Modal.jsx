import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '600px' }) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div
            onClick={handleOverlayClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
                overflowY: 'auto'
            }}
        >
            <div
                className="modal"
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    boxShadow: 'var(--card-shadow)',
                    maxWidth: maxWidth,
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                }}
            >
                {title && (
                    <div
                        style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                            <X size={20} color="var(--text-tertiary)" />
                        </button>
                    </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
