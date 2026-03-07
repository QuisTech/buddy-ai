
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react";
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

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onSpeak(finalTranscript);
          setCurrentText("");
        } else {
          setCurrentText(interimTranscript);
        }
      };
    }
  }, [onSpeak]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
      setCurrentText("");
    }
  }, [isListening]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="relative">
        {isListening && (
          <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
        )}
        <Button
          size="lg"
          variant={isListening ? "destructive" : "primary"}
          className={cn(
            "w-20 h-20 rounded-full shadow-2xl transition-all duration-300",
            isListening && "scale-110"
          )}
          onClick={onToggleMic}
        >
          {isListening ? (
            <Mic className="w-10 h-10" />
          ) : (
            <MicOff className="w-10 h-10" />
          )}
        </Button>
      </div>

      <div className="text-center h-12 flex items-center justify-center">
        {isThinking ? (
          <div className="flex items-center gap-2 text-accent font-medium animate-pulse">
            <Sparkles className="w-5 h-5" />
            <span className="font-headline">Buddy is thinking...</span>
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm">
            {isListening 
              ? currentText || "I'm listening. Speak naturally..." 
              : "Tap the mic to start studying"}
          </p>
        )}
      </div>
    </div>
  );
}
