"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, MicOff, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInterfaceProps {
  onSpeak: (text: string) => void;
  isListening: boolean; // Master "Hands-free Mode" toggle
  isThinking: boolean;
  isSpeaking: boolean;
  onToggleMic: () => void;
}

export default function VoiceInterface({ 
  onSpeak, 
  isListening, 
  isThinking, 
  isSpeaking, 
  onToggleMic 
}: VoiceInterfaceProps) {
  const [currentText, setCurrentText] = useState("");
  const [isEngineActive, setIsEngineActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Track busy state in a ref for callbacks to avoid closure staleness
  const isBusyRef = useRef(false);
  useEffect(() => {
    isBusyRef.current = isThinking || isSpeaking;
  }, [isThinking, isSpeaking]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsEngineActive(true);
    recognition.onend = () => {
      setIsEngineActive(false);
      // Robust restart: if master toggle is ON and we're NOT busy, try to restart
      if (recognitionRef.current?.shouldBeActive && !isBusyRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // BENIGN: Ignore rapid start failures
          }
        }, 300);
      }
    };

    recognition.onresult = (event: any) => {
      // Don't capture while Buddy is explaining or processing
      if (isBusyRef.current) return;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        try { recognition.stop(); } catch (e) {}
        onSpeak(finalTranscript.trim());
        setCurrentText("");
      } else {
        setCurrentText(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore standard browser engine events that aren't real failures
      if (['aborted', 'no-speech', 'audio-capture'].includes(event.error)) return;
      console.warn("Speech engine warning:", event.error);
    };

    recognitionRef.current = {
      instance: recognition,
      shouldBeActive: isListening
    };

    return () => {
      if (recognitionRef.current?.instance) {
        recognitionRef.current.shouldBeActive = false;
        try { recognitionRef.current.instance.stop(); } catch (e) {}
      }
    };
  }, [onSpeak]);

  // Sync engine state with master toggle and Buddy's busy state
  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.shouldBeActive = isListening;
    const shouldRun = isListening && !isThinking && !isSpeaking;

    if (shouldRun && !isEngineActive) {
      try {
        recognitionRef.current.instance.start();
      } catch (e) {}
    } else if (!shouldRun && isEngineActive) {
      try {
        recognitionRef.current.instance.stop();
      } catch (e) {}
    }
  }, [isListening, isThinking, isSpeaking, isEngineActive]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="relative">
        {isEngineActive && (
          <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
        )}
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className={cn(
            "w-24 h-24 rounded-full shadow-2xl transition-all duration-500",
            isEngineActive && "scale-110 pulse-primary",
            (isThinking || isSpeaking) && "opacity-50 grayscale cursor-wait"
          )}
          onClick={onToggleMic}
          disabled={isThinking || isSpeaking}
        >
          {isThinking || isSpeaking ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isListening ? (
            <Mic className="w-12 h-12" />
          ) : (
            <MicOff className="w-12 h-12" />
          )}
        </Button>
      </div>

      <div className="text-center h-20 flex flex-col items-center justify-center gap-2">
        {isThinking || isSpeaking ? (
          <div className="flex flex-col items-center gap-2 text-primary font-medium">
            <Sparkles className="w-6 h-6 text-accent animate-bounce" />
            <span className="font-headline text-lg italic animate-pulse">
              {isSpeaking ? "Buddy is explaining..." : "Buddy is processing..."}
            </span>
          </div>
        ) : (
          <>
            <p className={cn(
                "text-base font-medium transition-colors duration-300 px-4",
                isListening ? "text-primary" : "text-muted-foreground"
            )}>
              {isListening 
                ? (currentText || "I'm listening... speak naturally!") 
                : "Hands-free mode is off. Tap to start."}
            </p>
            {isListening && isEngineActive && (
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Mic Active
                </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
