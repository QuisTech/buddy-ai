"use client";

import { useState, useRef, useEffect } from "react";
import CameraView, { CameraViewHandle } from "@/components/CameraView";
import VoiceInterface from "@/components/VoiceInterface";
import ConversationList, { Message } from "@/components/ConversationList";
import SessionSummary from "@/components/SessionSummary";
import { DirectorMode } from "@/components/DirectorMode/DirectorMode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  History, 
  Sparkles, 
  BrainCircuit, 
  Timer, 
  StopCircle,
  Video,
  Target,
  Send,
  Zap,
  Mic
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
  const [isSpeaking, setIsSpeaking] = useState(false); 
  const [sessionActive, setSessionActive] = useState(false);
  const [directorMode, setDirectorMode] = useState(false);
  const [chatInput, setChatInput] = useState("");
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
    setChatInput(""); 

    try {
      // Significantly expanded vision triggers for more natural conversation
      const visualTriggers = [
        "look", "see", "show", "read", "scan", "diagram", "page", "image", 
        "picture", "camera", "screen", "what is this", "correct", "this",
        "reading", "visible", "showing"
      ];
      
      const queryLower = text.toLowerCase();
      const needsVision = visualTriggers.some(t => queryLower.includes(t));

      let response: any;

      if (needsVision && cameraRef.current) {
        const photo = cameraRef.current.capture();
        if (photo) {
          // Primary vision call: Explanation
          const result = await visualExplanation({ 
            photoDataUri: photo, 
            context: text 
          });
          
          let annotatedImageUrl: string | undefined = undefined;
          
          // Optional enhancement: Annotation (heavy on quota)
          try {
            const annotationResult = await dynamicAnnotation({
              photoDataUri: photo,
              explanation: result.explanationText
            });
            annotatedImageUrl = annotationResult.annotatedImageDataUri;
          } catch (e) {
            console.warn("Annotation enhancement skipped due to quota or error", e);
          }

          response = {
            content: result.explanationText || "I've analyzed the material. Here's what I see.",
            audioUrl: result.audioDataUri,
            imageUrl: annotatedImageUrl
          };
        }
      } 
      
      // If we didn't trigger vision or vision failed to capture a photo
      if (!response) {
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

        // Proactive adaptive clarification (strictly limited to save quota)
        if (text.length > 50 && text.toLowerCase().includes("how") && !needsVision) {
          try {
            const clarification = await adaptiveClarification({
              concept: text,
              studentConfusion: text
            });
            if (clarification.clarificationType !== 'alternative-explanation') {
               response.content += `\n\n💡 Buddy Tip: ${clarification.clarificationText}`;
            }
          } catch (e) {
            // Silently ignore clarification failures to save primary conversation
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

      // Handle Audio playback
      if (response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        audio.play().catch(e => {
          console.warn("Audio playback issue", e);
          setIsSpeaking(false);
        });
      }

    } catch (error: any) {
      console.error(error);
      const isQuotaError = error.message?.includes("429") || error.message?.includes("quota");
      
      toast({
        variant: "destructive",
        title: isQuotaError ? "Buddy is taking a breather" : "Buddy hit a snag",
        description: isQuotaError 
          ? "I've hit my limit for this minute. Please wait about 30 seconds and ask me again!" 
          : "I'm having trouble processing that right now."
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserQuery(chatInput);
  };

  const toggleSession = () => {
    if (sessionActive) {
      setSummary({
        topics: ["Visual Analysis", "Contextual Support", "Active Learning"],
        keyTakeaways: [
          "Utilized vision for study material analysis.",
          "Engaged in hands-free spoken dialogue.",
          "Received context-aware academic support."
        ],
        furtherStudy: ["Subject Fundamentals", "Conceptual Mapping", "Active Recall techniques"]
      });
      setIsListening(false);
    } else {
      setSummary(null);
      setMessages([]);
      setIsListening(true); 
    }
    setSessionActive(!sessionActive);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body selection:bg-primary/20">
      {/* Header */}
      <header className="glass-morphism h-20 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h1 className="font-headline font-bold text-2xl tracking-tight leading-none">Buddy AI</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Always Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {sessionActive && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full">
              <Timer size={16} className="text-primary animate-pulse" />
              <span className="text-sm font-bold font-headline">Live Session</span>
            </div>
          )}
          <Button 
            id="btn-header-session"
            variant={sessionActive ? "destructive" : "default"} 
            onClick={toggleSession}
            className="rounded-full shadow-lg h-12 px-8 font-headline text-md transition-all active:scale-95"
          >
            {sessionActive ? (
              <><StopCircle className="mr-2 h-5 w-5" /> Finish</>
            ) : (
              <><Zap className="mr-2 h-5 w-5 fill-current" /> Start Session</>
            )}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Vision and Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative group">
             <CameraView ref={cameraRef} />
             <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/20">
                Eye Level Vision
             </div>
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center w-full px-6">
                <div className="bg-white/90 backdrop-blur-xl text-foreground px-6 py-3 rounded-full text-xs font-medium flex items-center gap-3 shadow-2xl border border-primary/10 transition-transform group-hover:scale-105">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  Buddy can see what you're showing
                </div>
             </div>
          </div>

          <Card className="flex-1 p-10 bg-gradient-to-br from-white to-primary/5 border-primary/10 flex flex-col items-center justify-center gap-8 min-h-[350px] shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            {sessionActive ? (
              <VoiceInterface 
                onSpeak={handleUserQuery}
                isListening={isListening}
                isThinking={isThinking}
                isSpeaking={isSpeaking}
                onToggleMic={() => setIsListening(!isListening)}
              />
            ) : (
              <div className="text-center max-w-sm">
                <div className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 rotate-12 shadow-lg">
                  <BookOpen size={48} />
                </div>
                <h2 className="text-3xl font-headline font-bold mb-4 tracking-tight">Ready to collaborate?</h2>
                <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
                  Start a session to enable hands-free voice interaction and real-time visual assistance.
                </p>
                <Button id="btn-initialize-agent" onClick={toggleSession} size="lg" className="rounded-full w-full h-14 text-lg font-headline shadow-xl hover:shadow-primary/20 transition-all">
                  Initialize Agent
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Transcription and Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {summary ? (
            <SessionSummary summary={summary} />
          ) : (
            <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 shadow-2xl bg-white/90 backdrop-blur-sm">
              <div className="p-5 border-b bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-lg">
                      <History className="w-5 h-5 text-primary" />
                   </div>
                   <h3 className="font-headline font-bold text-base">Conversation Flow</h3>
                </div>
                {messages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-primary/70">{messages.length} Exchanges</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-6 overflow-hidden">
                <ConversationList messages={messages} />
              </div>
              
              {sessionActive && (
                <div className="p-6 bg-white border-t space-y-4">
                  <form onSubmit={handleChatSubmit} className="flex gap-3">
                      <Input 
                      id="input-chat"
                      placeholder="Type a follow-up..." 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="rounded-full h-12 border-primary/10 focus-visible:ring-primary/30 bg-primary/5 px-6"
                      disabled={isThinking}
                    />
                    <Button 
                      id="btn-send-chat"
                      type="submit" 
                      size="icon" 
                      className="rounded-full shrink-0 w-12 h-12 shadow-lg hover:rotate-12 transition-transform"
                      disabled={!chatInput.trim() || isThinking}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                  <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-accent" />
                      <span>Vision Enabled</span>
                    </div>
                    <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                    <div className="flex items-center gap-1.5">
                      <Mic className="w-3 h-3 text-primary" />
                      <span>Hands-free Mode</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
             <Card className="p-5 border-primary/5 bg-gradient-to-br from-white to-primary/5 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-black text-primary/70 uppercase">Uptime</span>
                </div>
                <p className="text-2xl font-headline font-bold">100%</p>
             </Card>
             <Card className="p-5 border-accent/5 bg-gradient-to-br from-white to-accent/5 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <BrainCircuit className="w-5 h-5 text-accent" />
                  <span className="text-[10px] font-black text-accent/70 uppercase">Model</span>
                </div>
                <p className="text-2xl font-headline font-bold truncate">Gemini 1.5</p>
             </Card>
          </div>
        </div>
      </main>

      <footer className="py-8 px-8 border-t bg-white text-center text-[10px] text-muted-foreground/60 font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-4">
        <p>© 2026 Buddy AI • Hands-Free Visual Tutor</p>
        <button onClick={() => setDirectorMode(true)} className="hover:text-primary transition-colors focus:outline-none">
          [ Demo Mode ]
        </button>
      </footer>
      {directorMode && <DirectorMode onClose={() => setDirectorMode(false)} />}
    </div>
  );
}
