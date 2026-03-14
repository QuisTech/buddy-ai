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
  | { type: 'type'; targetId: string; text: string; delay?: number }
  | { type: 'wait'; delay: number };

const SCRIPT: ScriptStep[] = [
    // --- INTRODUCTION ---
    { type: 'cursor', x: '50%', y: '50%', delay: 1000 },
    { type: 'subtitle', text: 'Scenario: Hands-Free Visual Tutor', delay: 3000 },
    { type: 'log', text: '[System] Buddy AI Vision Engine initialized' },
   
    // --- START SESSION ---
    { type: 'subtitle', text: 'Step 1: Establishing Context', delay: 1000 },
    { type: 'cursor', targetId: 'btn-initialize-agent', delay: 1500 },
    { type: 'wait', delay: 800 },
    { type: 'click', targetId: 'btn-initialize-agent', delay: 500 },
    { type: 'log', text: '[Audio] Microphone active. Awaiting voice input.' },
   
    // --- SIMULATING VISION QUERY ---
    { type: 'subtitle', text: 'Step 2: Multimodal Analysis', delay: 2000 },
    { type: 'cursor', targetId: 'input-chat', delay: 1000 },
    { type: 'click', targetId: 'input-chat', delay: 500 },
    { type: 'subtitle', text: 'Buddy uses your camera to analyze study materials.', delay: 2000 },
    { type: 'type', targetId: 'input-chat', text: 'Can you explain this biological diagram?', delay: 2000 },
    { type: 'cursor', targetId: 'btn-send-chat', delay: 500 },
    { type: 'click', targetId: 'btn-send-chat', delay: 500 },
    { type: 'log', text: '[Vision] Capturing frame from webcam...' },
    { type: 'log', text: '[Genkit] Routing request to Gemini 1.5 Flash / Vision.' },
    
    // --- GENERATING RESPONSE ---
    { type: 'subtitle', text: 'Step 3: Real-Time Explanation', delay: 2000 },
    { type: 'cursor', x: '50%', y: '40%', delay: 1500 },
    { type: 'log', text: '[Audio] Generating TTS response...' },
    { type: 'wait', delay: 4000 },
    { type: 'subtitle', text: 'Buddy explains the material contextually and highlights key areas.', delay: 3000 },

    // --- FINISHING LOG ---
    { type: 'subtitle', text: 'Step 4: Intelligent Recap', delay: 2000 },
    { type: 'cursor', targetId: 'btn-header-session', delay: 1500 },
    { type: 'log', text: '[System] Session summarized and stored offline.' },
    { type: 'click', targetId: 'btn-header-session', delay: 500 },
    { type: 'wait', delay: 2000 },

    // --- OUTRO ---
    { type: 'subtitle', text: 'Buddy AI: Your Personal Live Tutor.', delay: 3000 },
    { type: 'event', eventType: 'System', message: 'Demo Completed' },
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
            else if (step.type === 'type' && step.targetId) {
                const el = document.getElementById(step.targetId) as HTMLInputElement;
                if (el) {
                    setIsClicking(true);
                    for(let i=0; i<step.text.length; i++) {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                        if (nativeInputValueSetter) {
                            nativeInputValueSetter.call(el, el.value + step.text[i]);
                            el.dispatchEvent(new Event('input', { bubbles: true}));
                        }
                        await new Promise(r => setTimeout(r, 60)); // typing speed
                    }
                    setIsClicking(false);
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
