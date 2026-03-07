
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInterfaceProps {
  onSpeak: (text: string) => void;
  isListening: boolean;
  isThinking: boolean;
  onToggleMic: () => void;
}

export default function VoiceInterface({ onSpeak, isListening, isThinking, onToggleMic }: VoiceInterfaceProps) {
  const [currentText, setCurrentText] = useState("");
  const recognitionRef = useRef<any>(null);
  const isThinkingRef = useRef(isThinking);

  // Keep ref in sync for the event handlers
  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Ignore input if the Buddy is currently thinking or responding to prevent feedback loops
        if (isThinkingRef.current) return;

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
          onSpeak(finalTranscript.trim());
          setCurrentText("");
        } else {
          setCurrentText(interimTranscript);
        }
      };

      recognition.onend = () => {
        // Automatically restart if we are supposed to be listening
        // This makes the interface truly hands-free
        if (recognitionRef.current && recognitionRef.current.active) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Failed to restart recognition:", e);
            }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
            // If permission denied, stop trying
            recognitionRef.current.active = false;
        }
      };

      recognitionRef.current = {
        instance: recognition,
        active: false
      };
    }

    return () => {
        if (recognitionRef.current?.instance) {
            recognitionRef.current.active = false;
            recognitionRef.current.instance.stop();
        }
    };
  }, [onSpeak]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.active = true;
      try {
        recognitionRef.current.instance.start();
      } catch (e) {
        // Already started
      }
    } else {
      recognitionRef.current.active = false;
      recognitionRef.current.instance.stop();
      setCurrentText("");
    }
  }, [isListening]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="relative">
        {isListening && !isThinking && (
          <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
        )}
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className={cn(
            "w-24 h-24 rounded-full shadow-2xl transition-all duration-500",
            isListening && !isThinking && "scale-110 pulse-primary",
            isThinking && "opacity-50 grayscale cursor-wait"
          )}
          onClick={onToggleMic}
          disabled={isThinking}
        >
          {isListening ? (
            <Mic className="w-12 h-12" />
          ) : (
            <MicOff className="w-12 h-12" />
          )}
        </Button>
      </div>

      <div className="text-center h-16 flex flex-col items-center justify-center gap-2">
        {isThinking ? (
          <div className="flex items-center gap-2 text-primary font-medium animate-pulse">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-headline text-lg italic">Buddy is processing...</span>
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
