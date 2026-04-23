import React from 'react';
import { useSession } from './hooks/useSession';
import { DualPaneViewer } from './components/DualPaneViewer';
import { ControlPanel } from './components/ControlPanel';
import { FeedbackModal } from './components/FeedbackModal';
import { exportResultsToCSV } from './utils/csvExporter';
import { parseFolder } from './utils/folderParser';
import { AdminPortal } from './components/AdminPortal';
import logo from './assets/logo.jpeg';

function App() {
  const {
    phase,
    currentIndex,
    totalCases,
    currentPair,
    submitAnswer,
    feedback,
    nextAfterFeedback,
    results,
    userId,
    startDemo,
    startCustom,
    registerExpert,
    resetSession
  } = useSession();

  // State for registration input
  const [expertName, setExpertName] = React.useState('');

  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const handleExport = () => {
    const filename = `${userId}_results.csv`;
    exportResultsToCSV(results, filename);
  };

  const handleZipUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const manifest = await parseFolder(file);
        const count = manifest.warmup.length + manifest.test.length;
        if (count === 0) {
          alert("No valid cases found (looking for triplets of input/real/synth in folders named 'warmup' or 'test').");
        } else {
          startCustom(manifest);
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing ZIP file. Make sure it's a valid expert package.");
      }
    }
  };

  const [adminMode, setAdminMode] = React.useState(false);

  if (adminMode) {
    return (
      <div className="layout-container" style={{ alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
        <AdminPortal onExit={() => setAdminMode(false)} />
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="layout-container" style={{ alignItems: 'flex-start', justifyContent: 'center', textAlign: 'center', paddingTop: '10vh' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img src={logo} alt="Lab Logo" style={{ height: '140px', borderRadius: '8px' }} />
          </div>
          <h1>MRI Authenticity Validator</h1>
          <p style={{ color: 'var(--text-muted)' }}>Select a data source to begin evaluation.</p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <button className="btn btn-primary">
                Load ZIP Package
              </button>
              <input
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', width: '100%' }}>
            <button
              onClick={() => setAdminMode(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', opacity: 0.5 }}
            >
              Admin Access
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <strong>Expert Upload Guide:</strong> Directly upload the downloaded expert package ZIP file.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'registration') {
    return (
      <div className="layout-container" style={{ alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
        <div style={styles.resultsContainer}>
          <h1>Expert Registration</h1>
          <p>Please enter your ID or Name to begin the session.</p>

          <input
            type="text"
            value={expertName}
            onChange={(e) => setExpertName(e.target.value)}
            placeholder="Enter Expert Name/ID"
            style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '250px' }}
          />

          <button
            className="btn btn-primary"
            onClick={() => {
              if (expertName.trim()) registerExpert(expertName.trim());
            }}
            disabled={!expertName.trim()}
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="layout-container" style={{ alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
        <div style={styles.resultsContainer}>
          <h1>Session Complete</h1>
          <p>Thank you for participating.</p>

          <div style={styles.statBox}>
            <p><strong>Total Cases:</strong> {results.length}</p>
            <p><strong>User ID:</strong> {userId}</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleExport}>
              Download Results (CSV)
            </button>

            <button className="btn" onClick={() => {
              if (confirm("Have you downloaded the results? Clicking OK will reset for the next user.")) {
                setExpertName('');
                resetSession();
              }
            }}>
              Start New Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'transition_warmup_to_test') {
    return (
      <div className="layout-container" style={{ alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
        <div style={{ ...styles.resultsContainer, borderColor: 'var(--accent-color)' }}>
          <h1>Warm-up Complete</h1>
          <p>Starting Test Phase...</p>
          <div style={{ marginTop: '1rem', fontSize: '2rem' }}>⏳</div>
        </div>
      </div>
    );
  }

  // Active Phase (Warmup or Test)
  // Ensure we have a pair to show
  if (!currentPair) {
    return <div className="layout-container"><div>Loading case...</div></div>;
  }

  return (
    <div className="layout-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', cursor: 'pointer' }} title="Go to Home">
            <img src={logo} alt="Lab Logo" style={{ height: '60px', borderRadius: '4px' }} />
            <h1>MRI Authenticity Validator</h1>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
             onClick={() => setIsDarkMode(!isDarkMode)} 
             style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
          >
             {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            User: {userId}
          </div>
        </div>
      </header>

      <div style={styles.mainContent}>
        <div style={styles.viewerSection}>
          <DualPaneViewer
            leftSrc={currentPair.input}
            rightSrc={currentPair.target}
            leftModality={currentPair.inputModality}
            rightModality={currentPair.targetModality}
          />
        </div>

        <div style={styles.sidebar}>
          <ControlPanel
            onSubmit={submitAnswer}
            currentCaseIndex={currentIndex}
            totalCases={totalCases}
            phase={phase}
          />
        </div>
      </div>

      {feedback && (
        <FeedbackModal
          correct={feedback.correct}
          actual={feedback.actualTarget}
          onNext={nextAfterFeedback}
        />
      )}
    </div>
  );
}

const styles = {
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden', // Contain scrolling
    height: '100%',
  },
  viewerSection: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  sidebar: {
    width: '320px',
    background: 'var(--bg-primary)',
    borderLeft: '1px solid var(--border-color)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
  },
  resultsContainer: {
    background: 'var(--bg-secondary)',
    padding: '3rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    textAlign: 'center',
    gap: '2rem',
    display: 'flex',
    flexDirection: 'column',
  },
  statBox: {
    background: 'var(--bg-tertiary)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left',
  }
};

export default App;
