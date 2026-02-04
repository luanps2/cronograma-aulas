import React from 'react';
import Modal from './Modal';

export default function SettingsFormModal({ isOpen, onClose, title, children }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="500px">
            <div style={{ padding: '0 24px 24px 24px' }}>
                {children}
            </div>
        </Modal>
    );
}
