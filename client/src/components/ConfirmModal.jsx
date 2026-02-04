import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'confirm',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={48} color="#4CAF50" />;
            case 'error': case 'delete': return <XCircle size={48} color="#F44336" />;
            default: return <AlertTriangle size={48} color="#FF9800" />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': case 'delete': return '#F44336';
            default: return '#FF9800';
        }
    };

    const modalContent = (
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
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
                zIndex: 10000,
                padding: '20px'
            }}
        >
            <div
                className="modal"
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    boxShadow: 'var(--card-shadow)',
                    maxWidth: '400px',
                    width: '100%',
                    padding: '30px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ padding: '15px', borderRadius: '50%', background: `${getColor()}15` }}>
                        {getIcon()}
                    </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '10px' }}>{title}</h3>
                <p style={{ color: 'var(--text-tertiary)', lineHeight: '1.5', marginBottom: '30px' }}>{message}</p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {type === 'confirm' && (
                        <button
                            className="btn-outline"
                            onClick={onClose}
                            style={{ flex: 1 }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        className="btn-primary"
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        style={{
                            flex: 1,
                            backgroundColor: type === 'error' || type === 'delete' ? '#F44336' : undefined,
                            borderColor: type === 'error' || type === 'delete' ? '#D32F2F' : undefined
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
