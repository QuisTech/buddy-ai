import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PluginConsole, PluginConsoleRef } from './PluginConsole';

// Script designed for 1920x1080 roughly, utilizing percentages where possible
// NEW: Added targetId for pixel-perfect element targeting
type ScriptStep =
  | { type: 'cursor'; targetId?: string; x?: number | string; y?: number | string; delay?: number }
  | { type: 'click'; targetId?: string; delay?: number }
  | { type: 'subtitle'; text: string; delay?: number }
  | { type: 'log'; text: string; delay?: number }
  | { type: 'event'; eventType: string; message: string; delay?: number }
  | { type: 'scroll'; targetId?: string; y: number; delay?: number } // y matches scrollTop
  | { type: 'wait'; delay: number };

const SCRIPT: ScriptStep[] = [
    // --- 0:00 - 0:20: INTRODUCTION ---
    { type: 'cursor', x: '50%', y: '50%', delay: 1000 },
    { type: 'subtitle', text: 'Scenario: Verifiable High-Value Agreement', delay: 3000 },
    { type: 'log', text: '[System] Foxit Sentinel Pro v24.05 initialized' },
   
    // --- TEMPLATE SELECTION ---
    { type: 'subtitle', text: 'Step 1: Selecting the Legal Framework', delay: 1000 },
    { type: 'cursor', targetId: 'template-TPL-NDA-V2', delay: 1500 }, // Move to NDA
    { type: 'wait', delay: 800 }, // Hover
    { type: 'click', targetId: 'template-TPL-NDA-V2', delay: 500 }, // Click NDA
    { type: 'log', text: '[Template] Switching context to NON-DISCLOSURE AGREEMENT' },
   
    { type: 'cursor', targetId: 'template-TPL-SVC-V1', delay: 1000 }, // Move to MSA
    { type: 'wait', delay: 500 },
    { type: 'click', targetId: 'template-TPL-SVC-V1', delay: 500 }, // Click MSA
    { type: 'log', text: '[Template] Loading Master Service Agreement schema...' },
   
    { type: 'cursor', targetId: 'template-TPL-NDA-V2', delay: 1000 }, // Back to NDA
    { type: 'click', targetId: 'template-TPL-NDA-V2', delay: 500 },
    { type: 'log', text: '[Template] Validated: TPL-NDA-V2' },

    // --- AUTOFILL ---
    { type: 'subtitle', text: 'Step 2: Intelligent Data Injection', delay: 1000 },
    { type: 'cursor', targetId: 'input-partyA', delay: 1500 }, // Point at fields area
    { type: 'subtitle', text: 'We use AI to extract "Wayne Enterprises" from the deal context.', delay: 3000 },
   
    { type: 'cursor', targetId: 'btn-autofill', delay: 1500 }, // Move to Autofill Button
    { type: 'wait', delay: 800 }, // Hover to show tooltip
    { type: 'click', targetId: 'btn-autofill', delay: 500 }, // Click
    { type: 'log', text: '[AI] Extracting entities from deal context...' },
    { type: 'log', text: '[AI] Injecting: "Wayne Enterprises", "Gotham City"' },
    { type: 'event', eventType: 'DataInjection', message: 'Fields Populated (Confidence: 99%)' },
    { type: 'subtitle', text: 'Notice the immediate form population.', delay: 3000 },
   
    // --- GENERATION ---
    { type: 'subtitle', text: 'Step 3: The Orchestration Pipeline', delay: 1000 },
    { type: 'cursor', targetId: 'service-linearize', delay: 1500 }, // Move to Linearize
    { type: 'wait', delay: 500 },
    { type: 'click', targetId: 'service-linearize', delay: 500 }, // Toggle Linearize
    { type: 'log', text: '[Config] Web Optimization: ENABLED' },

    { type: 'cursor', targetId: 'btn-generate', delay: 1500 }, // Move to Generate
    { type: 'wait', delay: 1000 }, // Dramatic pause
    { type: 'click', targetId: 'btn-generate', delay: 500 }, // Click
    { type: 'subtitle', text: 'Sending payload to Foxit PDF Services API...', delay: 2000 },
    { type: 'log', text: '[API] POST /api/generate' },
   
    // SCROLL UP TO SEE PIPELINE
    { type: 'scroll', targetId: 'window', y: 0, delay: 1000 },

    // Watch status
    { type: 'cursor', x: '50%', y: '32%', delay: 1500 }, // Point at Pipeline Visualizer
    { type: 'subtitle', text: 'Foxit API processes watermarking and linearization in real-time.', delay: 4000 },
    { type: 'log', text: '[Foxit] Status: CONVERTING...' },
    { type: 'wait', delay: 3000 }, // Wait for doc gen
    { type: 'log', text: '[Foxit] Status: WATERMARKING...' },
    { type: 'wait', delay: 1500 },
    { type: 'log', text: '[Foxit] Status: LINEARIZING...' },
    { type: 'log', text: '[Foxit] SUCCESS. Downloading artifact.' },

    // --- VERIFYING THE DOC ---
    { type: 'subtitle', text: 'Step 4: Artifact Verification', delay: 1000 },
    { type: 'cursor', x: '65%', y: '45%', delay: 1500 }, // Doc Header
    { type: 'subtitle', text: 'Confirming: Wayne Enterprises vs Queen Industries', delay: 3000 },
    { type: 'scroll', y: 150, delay: 2000 },
   
    // Watermark
    { type: 'cursor', x: '50%', y: '50%', delay: 1000 },
    { type: 'subtitle', text: 'Security Overlay: CONFIDENTIAL', delay: 2000 },
    { type: 'scroll', y: 400, delay: 2000 },
   
    // Signature
    { type: 'subtitle', text: 'Validating Digital Signature Block...', delay: 2000 },
    { type: 'scroll', y: 800, delay: 3000 },
    { type: 'cursor', x: '75%', y: '85%', delay: 1000 },
    { type: 'log', text: '[Audit] Signature Verified: Jane Foxit' },
    { type: 'scroll', y: 0, delay: 2000 },

    // --- LEDGER VERIFICATION ---
    { type: 'subtitle', text: 'Step 5: The Immutable Audit Ledger', delay: 1000 },
    { type: 'cursor', targetId: 'tab-ledger', delay: 1500 }, // Move to Tabs
    { type: 'subtitle', text: 'Every action is cryptographically recorded.', delay: 2000 },
    { type: 'wait', delay: 500 }, // Hover Ledger Tab
   
    { type: 'click', targetId: 'tab-ledger', delay: 1000 }, // Click Tab
   
    // Wait for tab switch visually
    { type: 'subtitle', text: 'Here is the complete history of this document.', delay: 3000 },
    { type: 'cursor', x: '50%', y: '30%', delay: 1500 }, // Move to first card
    { type: 'log', text: '[Ledger] Block #99201 Verified' },
    { type: 'subtitle', text: 'Trace ID, Timestamp, and Hash match our generated PDF.', delay: 4000 },

    // --- OUTRO ---
    { type: 'subtitle', text: 'Foxit Sentinel Pro: Absolute Integrity.', delay: 3000 },
    { type: 'event', eventType: 'Blockchain', message: 'Transaction Finalized' },
    { type: 'cursor', x: '95%', y: '95%', delay: 1000 },
];

export function DirectorMode({ onClose }: { onClose: () => void }) {
    const [subtitle, setSubtitle] = useState('');
    const [cursorPos, setCursorPos] = useState({ x: 100, y: 100 });
    const [isClicking, setIsClicking] = useState(false);
   
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const webcamRef = useRef<HTMLVideoElement>(null);
    const consoleRef = useRef<PluginConsoleRef>(null);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9; // Slowed down for clarity
            window.speechSynthesis.speak(utterance);
        }
    };

    const startRecordingFlow = async () => {
        try {
            // Webcam
            try {
                const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (webcamRef.current) webcamRef.current.srcObject = camStream;
            } catch (e) {
                console.warn("No camera found", e);
            }

            // Screen Share
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: "browser" },
                audio: false
            });
           
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `foxit-audit-demo-final-${Date.now()}.webm`;
                a.click();
            };
           
            mediaRecorderRef.current = recorder;
           
            // Countdown
            for (let i = 5; i > 0; i--) {
                setSubtitle(`Initializing Director Mode in ${i}...`);
                await new Promise(r => setTimeout(r, 1000));
            }
            setSubtitle("");
           
            recorder.start();
            runScript();
           
        } catch (err) {
            console.error("Recording failed:", err);
            onClose();
        }
    };
   
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const runScript = async () => {
        for (const step of SCRIPT) {
            if (step.type === 'subtitle') {
                setSubtitle(step.text);
                speak(step.text.replace(/^(Scenario|Action|Effect|Step \d): /, ''));
            }
            else if (step.type === 'log') {
                consoleRef.current?.log(step.text, 'info');
            }
           
            // Handle Cursor Movement
            // Logic: If active step has a targetId, we move there.
            // OR if it's a explicit 'cursor' step with coordinates, we move there.
            let nextPos = null;
           
            if ('targetId' in step && step.targetId) {
                const el = document.getElementById(step.targetId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    nextPos = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
            }
            else if (step.type === 'cursor' && step.x !== undefined && step.y !== undefined) {
                nextPos = {
                    x: typeof step.x === 'string' ? (parseFloat(step.x) / 100) * window.innerWidth : step.x,
                    y: typeof step.y === 'string' ? (parseFloat(step.y) / 100) * window.innerHeight : step.y
                };
            }

            if (nextPos) {
                setCursorPos(nextPos);
            }

            // Handle Clicks
            if (step.type === 'click') {
                setIsClicking(true);
                await new Promise(r => setTimeout(r, 200));
               
                if (step.targetId) {
                    const el = document.getElementById(step.targetId);
                    if (el) el.click();
                } else {
                    // Fallback to coordinates
                    const elem = document.elementFromPoint(cursorPos.x, cursorPos.y);
                    if (elem && elem instanceof HTMLElement) {
                        elem.click();
                        const btn = elem.closest('button') || elem.closest('select') || elem.closest('input');
                        if (btn && btn !== elem) btn.click();
                    }
                }
               
                await new Promise(r => setTimeout(r, 200));
                setIsClicking(false);
            }
           
            if (step.type === 'scroll') {
                if (step.targetId === 'window') {
                    window.scrollTo({ top: step.y, behavior: 'smooth' });
                } else if (step.targetId) {
                    const el = document.getElementById(step.targetId);
                    if (el) el.scrollTo({ top: step.y, behavior: 'smooth' });
                } else {
                    // Fallback to preview container
                    const container = document.getElementById('preview-container');
                    if (container) {
                        container.scrollTo({ top: step.y, behavior: 'smooth' });
                    }
                }
            }
            else if (step.type === 'event') {
                 try {
                     await fetch('http://localhost:3001/api/events', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ eventType: step.eventType, message: step.message })
                     });
                     consoleRef.current?.log(`[Event] ${step.eventType}`, 'success');
                 } catch (e) {}
            }
            else if (step.type === 'wait') {
                // Explicit wait step
            }
           
            if (step.delay) await new Promise(r => setTimeout(r, step.delay));
        }
       
        stopRecording();
        setSubtitle("Saving Artifact...");
        setTimeout(onClose, 3000);
    };

    const hasStartedRef = useRef(false);
    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;
        startRecordingFlow();
    }, []);

    return (
        <div className="director-overlay">
            {/* Virtual Mouse */}
            <motion.div
                className="virtual-mouse"
                animate={{ x: cursorPos.x, y: cursorPos.y }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
            >
                <div className={`cursor-pointer ${isClicking ? 'cursor-clicking' : ''}`}></div>
            </motion.div>

            <AnimatePresence>
                {subtitle && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="demo-subtitle"
                    >
                        {subtitle}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="webcam-overlay">
                <video ref={webcamRef} autoPlay muted playsInline className="webcam-video" />
            </div>

            <PluginConsole ref={consoleRef} />

            <button className="stop-btn" onClick={() => { stopRecording(); onClose(); }}>
                <div style={{width: 10, height: 10, background: 'red', borderRadius: '50%'}}></div>
            </button>
        </div>
    );
}
