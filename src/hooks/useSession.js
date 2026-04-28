import { useState, useEffect, useCallback, useRef } from 'react';
import { loadManifest } from '../utils/manifestLoader';
import { getNextTargetType, getTargetImage } from '../utils/randomizer';
import { APP_CONFIG } from '../config';

export function useSession() {
    const [manifest, setManifest] = useState(null);
    const [phase, setPhase] = useState('loading'); // loading, warmup, test, finished
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState([]);
    const [currentPair, setCurrentPair] = useState(null); // { input, target, targetType, id }
    const [feedback, setFeedback] = useState(null); // { correct, actualTarget } for warmup
    const [userId, setUserId] = useState(`expert_${Date.now()}`);

    const startTimeRef = useRef(0);

    // Manual init methods
    const startDemo = useCallback(async () => {
        try {
            const data = await loadManifest();
            setManifest(data);
            setPhase('registration');
        } catch (err) {
            console.error(err);
            alert("Failed to load demo data");
        }
    }, []);

    const startCustom = useCallback((data) => {
        if (!data.warmup || !data.test) {
            alert("Invalid manifest structure");
            return;
        }
        setManifest(data);
        setPhase('registration');
    }, []);

    const registerExpert = useCallback((name) => {
        setUserId(name);
        setPhase('warmup');
        setCurrentIndex(0);
        setResults([]);
    }, []);

    const resetSession = useCallback(() => {
        setPhase('registration');
        setCurrentIndex(0);
        setResults([]);
        setUserId('');
        setFeedback(null);
    }, []);

    // Prepare next case when index or phase changes
    useEffect(() => {
        if (!manifest || phase === 'loading' || phase === 'finished' || phase === 'transition_warmup_to_test' || phase === 'registration') return;

        const collection = manifest[phase];
        if (currentIndex >= collection.length) {
            if (phase === 'warmup') {
                // Transition to test with delay
                setPhase('transition_warmup_to_test');
                setTimeout(() => {
                    setPhase('test');
                    setCurrentIndex(0);
                }, 2000);
                return;
            } else if (phase === 'test') {
                setPhase('finished');
                return;
            }
        }

        const rawCase = collection[currentIndex];

        // Determine target
        let targetUrl, targetTypeStr;

        if (phase === 'warmup') {
            // Warmup: We have acquired and synthetic. Randomize locally.
            targetTypeStr = getNextTargetType();
            targetUrl = getTargetImage(rawCase, targetTypeStr);
        } else {
            // Test: We likely only have 'target' (blinded).
            // Or fallback if we somehow have acquired/synth but it's test mode (shouldn't happen with blinded pack, but handle gracefully)
            if (rawCase.target) {
                targetUrl = rawCase.target;
                targetTypeStr = 'BLINDED'; // We don't know
            } else {
                // Fallback if test mode but has acquired/synth (e.g. demo data)
                targetTypeStr = getNextTargetType();
                targetUrl = getTargetImage(rawCase, targetTypeStr);
            }
        }

        // Determine target modality based on targetTypeStr
        let targetModality = '';
        if (targetTypeStr === 'Acquired') targetModality = rawCase.acquiredModality;
        else if (targetTypeStr === 'Synthetic') targetModality = rawCase.syntheticModality;
        else targetModality = rawCase.targetModality || ''; // Blinded or default case

        setCurrentPair({
            id: rawCase.id,
            input: rawCase.input,
            target: targetUrl,
            targetType: targetTypeStr, // 'Acquired', 'Synthetic', or 'BLINDED'
            inputModality: rawCase.inputModality,
            targetModality: targetModality,
            rawCase: rawCase
        });

        startTimeRef.current = performance.now();

    }, [currentIndex, phase, manifest]);

    const submitAnswer = useCallback((rating) => {
        if (!currentPair) return;

        const endTime = performance.now();
        const duration = Math.round(endTime - startTimeRef.current);

        let isCorrect = null;
        if (currentPair.targetType !== 'BLINDED') {
            if (currentPair.targetType === 'Acquired') {
                isCorrect = rating >= 4 ? true : (rating <= 2 ? false : null);
            } else if (currentPair.targetType === 'Synthetic') {
                isCorrect = rating <= 2 ? true : (rating >= 4 ? false : null);
            }
        }

        // Record result
        const resultRecord = {
            UserID: userId,
            Phase: phase,
            CaseID: currentPair.id,
            TargetShown: currentPair.targetType, // Will be BLINDED in test
            Rating: rating,
            ResponseTime_ms: duration,
            Timestamp: new Date().toISOString()
        };

        setResults(prev => [...prev, resultRecord]);

        if (phase === 'warmup') {
            // Show feedback
            setFeedback({
                correct: isCorrect,
                actualTarget: currentPair.targetType
            });
            // Waiting for user to dismiss feedback to proceed
        } else {
            // Test phase: immediate next
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentPair, phase, userId]);

    const nextAfterFeedback = useCallback(() => {
        setFeedback(null);
        setCurrentIndex(prev => prev + 1);
    }, []);

    return {
        phase,
        currentIndex,
        totalCases: manifest ? manifest[phase]?.length : 0,
        currentPair,
        submitAnswer,
        feedback,
        nextAfterFeedback,
        results,
        userId,
        setUserId,
        startDemo,
        startCustom,
        registerExpert,
        resetSession
    };
}
