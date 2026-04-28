import React, { useState, useEffect } from 'react';

export function ControlPanel({ onSubmit, currentCaseIndex, totalCases, phase }) {
    const [rating, setRating] = useState(null); // 1-5

    // Reset state when case index changes
    useEffect(() => {
        setRating(null);
    }, [currentCaseIndex]);

    const handleSubmit = () => {
        if (rating !== null) {
            onSubmit(rating);
        }
    };

    const likertOptions = [
        { value: 1, label: 'Definitely Synthetic' },
        { value: 2, label: 'Probably Synthetic' },
        { value: 3, label: 'Cannot Determine' },
        { value: 4, label: 'Probably Acquired' },
        { value: 5, label: 'Definitely Acquired' },
    ];

    return (
        <div className="control-panel" style={styles.container}>
            <div style={styles.header}>
                <div style={styles.phaseBadge}>
                    {phase === 'warmup' ? 'Warm-up Phase' : 'Test Phase'}
                </div>
                <div style={styles.progress}>
                    Case {currentCaseIndex + 1} / {totalCases}
                </div>
            </div>

            <div style={styles.section}>
                <label style={styles.label}>Evaluation (1-5)</label>
                <div style={styles.likertGroup}>
                    {likertOptions.map(opt => (
                        <button
                            key={opt.value}
                            className={`btn ${rating === opt.value ? 'selected' : ''}`}
                            style={{
                                ...styles.likertBtn,
                                ...(rating === opt.value ? styles.selectedLikert : {})
                            }}
                            onClick={() => setRating(opt.value)}
                        >
                            <div style={styles.likertHeader}>
                                <span style={styles.likertValue}>{opt.value}</span>
                                <span style={styles.likertLabel}>{opt.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={rating === null}
                style={styles.submitBtn}
            >
                Submit Evaluation
            </button>
        </div>
    );
}

const styles = {
    container: {
        background: 'var(--bg-secondary)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '300px',
        flexShrink: 0,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
    },
    phaseBadge: {
        background: 'var(--bg-tertiary)',
        padding: '0.2rem 0.6rem',
        borderRadius: '99px',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        fontWeight: 600,
        letterSpacing: '0.05em',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.9rem',
        fontWeight: 500,
        color: 'var(--text-main)',
    },
    likertGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    likertBtn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '0.75rem',
        border: '2px solid transparent',
        background: 'var(--bg-tertiary)',
        textAlign: 'left',
    },
    selectedLikert: {
        background: 'var(--accent-glow)',
    },
    likertHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.25rem',
    },
    likertValue: {
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: 'var(--accent-color)',
        width: '1.5rem',
        textAlign: 'center',
    },
    likertLabel: {
        fontWeight: '600',
        fontSize: '0.95rem',
        color: 'var(--text-main)',
    },
    submitBtn: {
        marginTop: 'auto',
        padding: '0.8rem',
        fontSize: '1rem',
    },
};
