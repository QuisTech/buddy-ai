
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInterfaceProps {
  onSpeak: (text: string) => void;
  isListening: boolean; // Master "Hands-free Mode" switch
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
  const recognitionRef = useRef<any>(null);
  
  // Ref for internal state checking in callbacks
  const isBusyRef = useRef(false);
  useEffect(() => {
    isBusyRef.current = isThinking || isSpeaking;
  }, [isThinking, isSpeaking]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Ignore input if Buddy is speaking or thinking to prevent feedback loops
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
          // Stop recognition immediately when a result is found to cleanly hand off to the Buddy
          try { recognition.stop(); } catch (e) {}
          onSpeak(finalTranscript.trim());
          setCurrentText("");
        } else {
          setCurrentText(interimTranscript);
        }
      };

      recognition.onend = () => {
        // Robust auto-restart logic for continuous hands-free mode
        // Only restart if hands-free is enabled and Buddy is NOT busy
        if (recognitionRef.current?.shouldBeActive && !isBusyRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // Ignore restart errors
            }
          }, 100);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return;
        console.error("Speech Recognition Error:", event.error);
      };

      recognitionRef.current = {
        instance: recognition,
        shouldBeActive: false
      };
    }

    return () => {
      if (recognitionRef.current?.instance) {
        recognitionRef.current.shouldBeActive = false;
        try { recognitionRef.current.instance.stop(); } catch (e) {}
      }
    };
  }, [onSpeak]);

  // Master logic to handle starting/stopping recognition based on all states
  useEffect(() => {
    if (!recognitionRef.current) return;

    const shouldActuallyListen = isListening && !isThinking && !isSpeaking;

    if (shouldActuallyListen) {
      recognitionRef.current.shouldBeActive = true;
      try {
        recognitionRef.current.instance.start();
      } catch (e) {
        // Already started or busy
      }
    } else {
      // If we're not supposed to be listening (either hands-free is off OR buddy is busy)
      if (!isListening) {
        recognitionRef.current.shouldBeActive = false;
      }
      try {
        recognitionRef.current.instance.stop();
      } catch (e) {
        // Already stopped
      }
      setCurrentText("");
    }
  }, [isListening, isThinking, isSpeaking]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="relative">
        {(isListening && !isThinking && !isSpeaking) && (
          <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
        )}
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className={cn(
            "w-24 h-24 rounded-full shadow-2xl transition-all duration-500",
            (isListening && !isThinking && !isSpeaking) && "scale-110 pulse-primary",
            (isThinking || isSpeaking) && "opacity-50 grayscale cursor-wait"
          )}
          onClick={onToggleMic}
          disabled={isThinking || isSpeaking}
        >
          {isListening ? (
            <Mic className="w-12 h-12" />
          ) : (
            <MicOff className="w-12 h-12" />
          )}
        </Button>
      </div>

      <div className="text-center h-16 flex flex-col items-center justify-center gap-2">
        {isThinking || isSpeaking ? (
          <div className="flex items-center gap-2 text-primary font-medium animate-pulse">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-headline text-lg italic">
              {isSpeaking ? "Buddy is explaining..." : "Buddy is processing..."}
            </span>
          </div>
        ) : (
          <>
            <p className={cn(
                "text-sm font-medium transition-colors duration-300",
                isListening ? "text-primary" : "text-muted-foreground"
            )}>
              {isListening 
                ? (currentText || "I'm listening for your questions...") 
                : "Hands-free mode is off. Tap to start."}
            </p>
            {isListening && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                    Listening continuously
                </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
