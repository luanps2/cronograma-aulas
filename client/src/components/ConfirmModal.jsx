import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'confirm', // 'confirm', 'success', 'error'
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={48} color="#4CAF50" />;
            case 'error': return <XCircle size={48} color="#F44336" />;
            default: return <AlertTriangle size={48} color="#FF9800" />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            default: return '#FF9800';
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '30px' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ padding: '15px', borderRadius: '50%', background: `${getColor()}15` }}>
                        {getIcon()}
                    </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: '#333', marginBottom: '10px' }}>{title}</h3>
                <p style={{ color: '#666', lineHeight: '1.5', marginBottom: '30px' }}>{message}</p>

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
                            backgroundColor: type === 'error' ? '#F44336' : undefined,
                            borderColor: type === 'error' ? '#D32F2F' : undefined
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
