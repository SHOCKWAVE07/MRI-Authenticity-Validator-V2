import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export function DualPaneViewer({ leftSrc, rightSrc, leftModality, rightModality }) {
    const [sync, setSync] = useState(true); // Default to sync on, usually preferred
    const leftRef = useRef(null);
    const rightRef = useRef(null);
    const isSyncing = useRef(false);

    // Helper to apply transform to a target ref
    const syncTransform = useCallback((sourceRef, targetRef) => {
        if (!sync || isSyncing.current) return;
        if (!sourceRef.current || !targetRef.current) return;

        const { positionX, positionY, scale } = sourceRef.current.instance.transformState;

        // Check if target is already close to these values to avoid loop? 
        // Actually, simply setting a lock is safer.
        isSyncing.current = true;
        targetRef.current.setTransform(positionX, positionY, scale, 0); // 0 animation time for instant sync
        // Release lock after a tick
        setTimeout(() => {
            isSyncing.current = false;
        }, 0);
    }, [sync]);

    const handleLeftTransform = (ref) => {
        // ref is the wrapper instance provided by callback
        // But we have our own refs attached to the component.
        // We can standardise usage.
        syncTransform(leftRef, rightRef);
    };

    const handleRightTransform = (ref) => {
        syncTransform(rightRef, leftRef);
    };

    // Reset both when sources change
    useEffect(() => {
        if (leftRef.current) leftRef.current.resetTransform();
        if (rightRef.current) rightRef.current.resetTransform();
    }, [leftSrc, rightSrc]);

    return (
        <div style={styles.container}>
            <div style={styles.toolbar}>
                <label style={styles.syncLabel}>
                    <input
                        type="checkbox"
                        checked={sync}
                        onChange={(e) => setSync(e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    Sync Pan/Zoom
                </label>
                <span style={styles.hint}>Scroll to Zoom • Drag to Pan</span>
            </div>

            <div style={styles.panesContainer}>
                {/* Left Pane (Static Input) */}
                <div style={styles.paneWrapper}>
                    <div style={styles.paneLabel}>Input (Reference) {leftModality && `• ${leftModality}`}</div>
                    <div style={styles.paneContent}>
                        <TransformWrapper
                            ref={leftRef}
                            onTransformed={handleLeftTransform}
                            initialScale={1}
                            minScale={0.1}
                            maxScale={10}
                            limitToBounds={false} // Allow free panning
                        >
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                <img src={leftSrc} alt="Input" style={styles.image} />
                            </TransformComponent>
                        </TransformWrapper>
                    </div>
                </div>

                {/* Right Pane (Variable Target) */}
                <div style={styles.paneWrapper}>
                    <div style={styles.paneLabel}>Target ( Evaluate This ) {rightModality && `• ${rightModality}`}</div>
                    <div style={styles.paneContent}>
                        <TransformWrapper
                            ref={rightRef}
                            onTransformed={handleRightTransform}
                            initialScale={1}
                            minScale={0.1}
                            maxScale={10}
                            limitToBounds={false}
                        >
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                <img src={rightSrc} alt="Target" style={styles.image} />
                            </TransformComponent>
                        </TransformWrapper>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    toolbar: {
        padding: '0.5rem 1rem',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
    },
    syncLabel: {
        fontSize: '0.9rem',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
    },
    hint: {
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
    },
    panesContainer: {
        flex: 1,
        display: 'flex',
        gap: '2px', // split gutter
        background: 'var(--border-color)', // gutter color
        height: '100%',
    },
    paneWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#000', // Black background for images
        position: 'relative',
        overflow: 'hidden',
    },
    paneLabel: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        zIndex: 10,
        pointerEvents: 'none',
    },
    paneContent: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    image: {
        display: 'block',
        // We want natural size initially? Or fit?
        // Requirement: "render images at 1:1 pixel ratio unless zoomed"
        // So 'width: auto' is correct.
        width: 'auto',
        height: 'auto',
        maxWidth: 'none', // Allow it to be larger than container
    }
};
