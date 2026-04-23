import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const AdminPortal = ({ onExit }) => {
    const [phase, setPhase] = useState('login'); // login, setup, config, processing, complete
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [statusMsg, setStatusMsg] = useState('');
    const [progress, setProgress] = useState(0);

    // Parsing State
    const [parsedCases, setParsedCases] = useState([]);
    const [config, setConfig] = useState({ warmup: 0, test: 0 });

    // Login Handler
    const handleLogin = () => {
        if (credentials.username === 'admin' && credentials.password === 'iitj@123') {
            setPhase('setup');
        } else {
            alert('Invalid credentials');
        }
    };

    // Helper: Strip Metadata using Canvas
    const stripMetadata = async (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Export as blob (strips original metadata)
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    resolve(blob);
                }, 'image/png');
            };
            img.src = url;
        });
    };

    // 1. Config Phase: Parse Files
    const handleParse = (files) => {
        setStatusMsg('Analyzing folder...');

        const cases = new Map();
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            const parts = file.webkitRelativePath.split('/');
            if (parts.length < 2) continue;

            const filename = parts.pop().toLowerCase();
            const dirPath = parts.join('/');

            if (!/\.(png|jpg|jpeg|bmp)$/i.test(filename)) continue;

            if (!cases.has(dirPath)) cases.set(dirPath, {});

            const caseObj = cases.get(dirPath);
            if (filename.includes('input') || filename.includes('source')) caseObj.input = file;
            if (filename.includes('real')) caseObj.real = file;
            if (filename.includes('synth') || filename.includes('fake')) caseObj.synthetic = file;
        }

        const validCases = [];
        cases.forEach((imgs, idPath) => {
            if (imgs.input && imgs.real && imgs.synthetic) {
                validCases.push({
                    id: idPath.split('/').pop(),
                    imgs
                });
            }
        });

        if (validCases.length === 0) {
            alert('No valid cases found (looking for folders with input, real, and synthetic images).');
            return;
        }

        // Set state for config phase
        setParsedCases(validCases);
        // Default split: 20% warmup (min 1), rest test
        const defaultWarmup = Math.max(1, Math.floor(validCases.length * 0.2));
        setConfig({
            warmup: defaultWarmup,
            test: validCases.length - defaultWarmup
        });
        setPhase('config');
    };

    // 2. Generate Phase
    const handleGenerate = async () => {
        const totalReq = config.warmup + config.test;
        if (totalReq > parsedCases.length) {
            alert(`You requested ${totalReq} cases but only ${parsedCases.length} are available.`);
            return;
        }
        if (totalReq === 0) {
            alert("Please select at least one case.");
            return;
        }

        setPhase('processing');

        // Shuffle and Split
        const shuffled = [...parsedCases].sort(() => 0.5 - Math.random());
        const warmup = shuffled.slice(0, config.warmup);
        const test = shuffled.slice(config.warmup, config.warmup + config.test);

        const zip = new JSZip();
        const masterKey = [['Case_ID', 'Chosen_Target_Origin']]; // Header

        let processedCount = 0;
        const totalToProcess = warmup.length + test.length;

        // Process Warmup
        for (const c of warmup) {
            processedCount++;
            setProgress(Math.round((processedCount / totalToProcess) * 100));
            setStatusMsg(`Processing Warmup Case: ${c.id}...`);

            const folder = zip.folder(`warmup/${c.id}`);

            const inputBlob = await stripMetadata(c.imgs.input);
            const realBlob = await stripMetadata(c.imgs.real);
            const synthBlob = await stripMetadata(c.imgs.synthetic);

            folder.file(c.imgs.input.name.replace(/\.[^/.]+$/, "") + ".png", inputBlob);
            folder.file(c.imgs.real.name.replace(/\.[^/.]+$/, "") + ".png", realBlob);
            folder.file(c.imgs.synthetic.name.replace(/\.[^/.]+$/, "") + ".png", synthBlob);

            masterKey.push([c.id, 'WARMUP']);
        }

        // Process Test (Blind)
        for (const c of test) {
            processedCount++;
            setProgress(Math.round((processedCount / totalToProcess) * 100));
            setStatusMsg(`Blinding Test Case: ${c.id}...`);

            const isReal = Math.random() < 0.5;
            masterKey.push([c.id, isReal ? 'Real' : 'Synthetic']);

            const folder = zip.folder(`test/${c.id}`);

            const inputBlob = await stripMetadata(c.imgs.input);
            const targetFile = isReal ? c.imgs.real : c.imgs.synthetic;
            const targetBlob = await stripMetadata(targetFile);

            folder.file(c.imgs.input.name.replace(/\.[^/.]+$/, "") + ".png", inputBlob);
            folder.file(c.imgs.real.name.replace(/real/i, "target").replace(/\.[^/.]+$/, "") + ".png", targetBlob);
        }

        // CSV & Zip
        const csvContent = masterKey.map(e => e.join(',')).join('\n');
        zip.file('master_key.csv', csvContent);

        setStatusMsg('Finalizing Zip Package...');
        const content = await zip.generateAsync({ type: 'blob' });

        saveAs(content, 'expert_package.zip');

        setPhase('complete');
        setStatusMsg('Generation Complete!');
    };

    if (phase === 'login') {
        return (
            <div className="glass-card">
                <h1>Admin Portal</h1>
                <div style={{ textAlign: 'left', width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
                    <input
                        className="input-field"
                        type="text"
                        value={credentials.username}
                        onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                    />
                </div>
                <div style={{ textAlign: 'left', width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                    <input
                        className="input-field"
                        type="password"
                        value={credentials.password}
                        onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleLogin}>Login</button>
                <button className="btn" style={{ marginTop: '1rem', background: 'transparent', border: 'none' }} onClick={onExit}>
                    ← Back to Home
                </button>
            </div>
        );
    }

    if (phase === 'setup') {
        return (
            <div className="glass-card">
                <h1>Data Factory</h1>
                <p className="text-muted">Step 1: Upload Raw Dataset Folder</p>

                <div style={{ textAlign: 'left', width: '100%', position: 'relative' }}>
                    <div style={{
                        border: '2px dashed var(--border-color)',
                        padding: '2rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'border-color 0.2s'
                    }}
                        className="upload-zone"
                    >
                        <span style={{ color: 'var(--accent-color)' }}>Click or Drag Folder Here</span>
                        <input
                            type="file"
                            webkitdirectory=""
                            directory=""
                            multiple
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                            }}
                            onChange={(e) => {
                                if (e.target.files.length > 0) handleParse(e.target.files);
                            }}
                        />
                    </div>
                </div>

                <button className="btn" style={{ marginTop: '1rem', background: 'transparent', border: 'none' }} onClick={() => setPhase('login')}>
                    Logout
                </button>
            </div>
        );
    }

    if (phase === 'config') {
        return (
            <div className="glass-card">
                <h1>Configure Session</h1>
                <p className="text-muted">Found <strong>{parsedCases.length}</strong> valid cases.</p>

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', textAlign: 'left', width: '100%' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Warm-up Count</label>
                        <input
                            className="input-field"
                            type="number"
                            min="0"
                            max={parsedCases.length}
                            value={config.warmup}
                            onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                setConfig(prev => ({ ...prev, warmup: val }));
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Test Count</label>
                        <input
                            className="input-field"
                            type="number"
                            min="0"
                            max={parsedCases.length}
                            value={config.test}
                            onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                setConfig(prev => ({ ...prev, test: val }));
                            }}
                        />
                    </div>
                </div>

                <div style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', color: config.warmup + config.test > parsedCases.length ? 'var(--error)' : 'var(--text-muted)' }}>
                    Selected: {config.warmup + config.test} / {parsedCases.length}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={config.warmup + config.test > parsedCases.length || config.warmup + config.test === 0}
                >
                    Generate Package & Keys
                </button>
                <button className="btn" style={{ marginTop: '1rem', background: 'transparent', border: 'none' }} onClick={() => setPhase('setup')}>
                    Back to Upload
                </button>
            </div>
        );
    }

    if (phase === 'processing') {
        return (
            <div className="glass-card">
                <h1>Processing...</h1>
                <p>{statusMsg}</p>

                <div style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    height: '8px',
                    borderRadius: '4px',
                    marginTop: '1rem',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        background: 'var(--accent-color)',
                        height: '100%',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>
        );
    }

    if (phase === 'complete') {
        return (
            <div className="glass-card">
                <h1 style={{ color: 'var(--success)' }}>Operation Successful</h1>
                <p>The <strong>Expert Package.zip</strong> (containing master_key.csv) has been downloaded.</p>
                <button className="btn btn-primary" onClick={() => {
                    setPhase('setup');
                    setParsedCases([]);
                    setProgress(0);
                }}>
                    Process Another Dataset
                </button>
            </div>
        );
    }

    return null;
};
