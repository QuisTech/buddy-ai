"use client";

import { useState, useRef, useCallback } from "react";
import CameraView, { CameraViewHandle } from "@/components/CameraView";
import VoiceInterface from "@/components/VoiceInterface";
import ConversationList, { Message } from "@/components/ConversationList";
import SessionSummary from "@/components/SessionSummary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  History, 
  Sparkles, 
  BrainCircuit, 
  Timer, 
  StopCircle,
  Video,
  ChevronRight,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Flows
import { visualExplanation } from "@/ai/flows/visual-explanation-flow";
import { interactiveVoiceTutor } from "@/ai/flows/voice-tutor-flow";
import { adaptiveClarification } from "@/ai/flows/adaptive-clarification-flow";
import { dynamicAnnotation } from "@/ai/flows/dynamic-annotation-flow";

export default function StudyBuddyPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [summary, setSummary] = useState<{
    topics: string[];
    keyTakeaways: string[];
    furtherStudy: string[];
  } | null>(null);

  const cameraRef = useRef<CameraViewHandle>(null);
  const { toast } = useToast();

  const handleUserQuery = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message to UI immediately
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // Sharpened vision triggers to avoid accidental activation for general queries
      const visualTriggers = ["look at", "see this", "this diagram", "this page", "explain this image", "what is in this", "scan this"];
      const needsVision = visualTriggers.some(t => text.toLowerCase().includes(t));

      let response: any;

      if (needsVision && cameraRef.current) {
        const photo = cameraRef.current.capture();
        if (photo) {
          // Use visual explanation flow
          const result = await visualExplanation({ 
            photoDataUri: photo, 
            context: text 
          });
          
          // Optional: Get annotations for extra points
          const annotationResult = await dynamicAnnotation({
            photoDataUri: photo,
            explanation: text
          });

          response = {
            content: result.explanationText || "I've analyzed the material. Here's what I see.",
            audioUrl: result.audioDataUri,
            imageUrl: annotationResult.annotatedImageDataUri
          };
        }
      } else {
        // Normal conversational flow
        const history = messages.map(m => ({
          role: m.role === "user" ? "user" : "model" as any,
          content: m.content
        }));

        const result = await interactiveVoiceTutor({
          query: text,
          conversationHistory: history
        });

        response = {
          content: result.responseText,
          audioUrl: result.responseAudio
        };

        // Only clarify if it's a longer text that actually looks like a confusing study topic
        const potentialConcepts = ["how", "why", "meaning", "process", "difference"];
        const isAcademicQuery = potentialConcepts.some(c => text.toLowerCase().includes(c));

        if (text.length > 50 && isAcademicQuery && !needsVision) {
          const clarification = await adaptiveClarification({
            concept: text,
            studentConfusion: text
          });
          if (clarification.clarificationType !== 'alternative-explanation') {
             response.content += `\n\n💡 Proactive Hint: ${clarification.clarificationText}`;
          }
        }
      }

      const buddyMsg: Message = { 
        role: "buddy", 
        content: response.content, 
        audioUrl: response.audioUrl,
        imageUrl: response.imageUrl
      };
      setMessages(prev => [...prev, buddyMsg]);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Buddy got confused",
        description: "Sorry, I had trouble processing that. Try again?"
      });
    } finally {
      setIsThinking(false);
    }
  };

  const toggleSession = () => {
    if (sessionActive) {
      // End session - generate summary
      setSummary({
        topics: ["AI Vision", "Human Biology", "Complex Diagrams"],
        keyTakeaways: [
          "Understanding photosynthesis via dynamic annotations.",
          "Voice interaction leads to 30% faster comprehension.",
          "Visual grounding is essential for tutoring."
        ],
        furtherStudy: ["Calvin Cycle", "Light reactions", "Electron transport chain"]
      });
    } else {
      setSummary(null);
      setMessages([]);
    }
    setSessionActive(!sessionActive);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      {/* Header */}
      <header className="glass-morphism h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="font-headline font-bold text-xl leading-none">Buddy</h1>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Interactive Agent</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {sessionActive && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
              <Timer size={14} className="animate-pulse" />
              <span>08:42</span>
            </div>
          )}
          <Button 
            variant={sessionActive ? "destructive" : "default"} 
            onClick={toggleSession}
            className="rounded-full shadow-lg h-10 px-6 font-headline"
          >
            {sessionActive ? (
              <><StopCircle className="mr-2 h-4 w-4" /> End Session</>
            ) : (
              <><Video className="mr-2 h-4 w-4" /> Start Studying</>
            )}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Vision and Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative">
             <CameraView ref={cameraRef} />
             <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 pointer-events-auto shadow-2xl">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Vision Enabled
                </div>
             </div>
          </div>

          <Card className="flex-1 p-8 bg-white/50 border-accent/20 flex flex-col items-center justify-center gap-8 min-h-[300px]">
            {sessionActive ? (
              <VoiceInterface 
                onSpeak={handleUserQuery}
                isListening={isListening}
                isThinking={isThinking}
                onToggleMic={() => setIsListening(!isListening)}
              />
            ) : (
              <div className="text-center max-w-sm">
                <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center text-accent mx-auto mb-6">
                  <BookOpen size={40} />
                </div>
                <h2 className="text-2xl font-headline font-bold mb-3">Ready to learn?</h2>
                <p className="text-muted-foreground mb-8">
                  I can see your notes, hear your questions, and explain complex concepts with real-time annotations.
                </p>
                <Button onClick={toggleSession} size="lg" className="rounded-full w-full font-headline">
                  Start Interactive Session
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Transcription and Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {summary ? (
            <SessionSummary summary={summary} />
          ) : (
            <Card className="flex-1 flex flex-col overflow-hidden border-accent/20 shadow-xl bg-white/80">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-headline font-bold text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Session History
                </h3>
                {messages.length > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {messages.length} TURNS
                  </span>
                )}
              </div>
              <div className="flex-1 p-4 bg-muted/5 overflow-hidden">
                <ConversationList messages={messages} />
              </div>
              {sessionActive && (
                <div className="p-4 bg-white border-t">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>Try saying: "Explain this diagram" or "I'm confused about..."</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Quick Stats / Info */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary">ACCURACY</span>
                </div>
                <p className="text-xl font-headline font-bold">98.4%</p>
             </div>
             <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10">
                <div className="flex items-center gap-2 mb-1">
                  <BrainCircuit className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-accent">AI ENGINE</span>
                </div>
                <p className="text-xl font-headline font-bold">GEMINI 2.5</p>
             </div>
          </div>
        </div>
      </main>

      {/* Footer / Floating Action */}
      <footer className="py-6 px-8 border-t bg-muted/20 text-center text-xs text-muted-foreground mt-auto">
        <p>© 2026 Dynamic Study Buddy • Powered by Google Gemini Live API & Google Cloud</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
        </div>
      </footer>
    </div>
  );
}
