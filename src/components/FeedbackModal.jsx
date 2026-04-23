import React from 'react';

export function FeedbackModal({ correct, actual, onNext }) {
    let icon = '➖';
    let iconColor = 'var(--text-muted)';
    let title = 'Neutral';

    if (correct === true) {
        icon = '✔';
        iconColor = 'var(--success)';
        title = 'Correct!';
    } else if (correct === false) {
        icon = '✘';
        iconColor = 'var(--error)';
        title = 'Incorrect';
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={{ ...styles.icon, color: iconColor }}>
                    {icon}
                </div>
                <h2 style={styles.title}>
                    {title}
                </h2>
                <p style={styles.message}>
                    This image was actually <strong>{actual}</strong>.
                </p>
                <button className="btn btn-primary" onClick={onNext} style={styles.button}>
                    Next Case
                </button>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.8)', // high opacity for focus
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        width: '400px',
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    icon: {
        fontSize: '4rem',
        marginBottom: '1rem',
    },
    title: {
        fontSize: '1.5rem',
        marginBottom: '0.5rem',
        color: 'var(--text-main)',
    },
    message: {
        color: 'var(--text-muted)',
        marginBottom: '2rem',
    },
    button: {
        width: '100%',
        padding: '0.75rem',
    }
};
