
"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { User, Bot, Play, Pause } from "lucide-react";
import { Button } from "./ui/button";

export interface Message {
  role: "user" | "buddy";
  content: string;
  audioUrl?: string;
  imageUrl?: string;
  type?: "explanation" | "annotation" | "clarification";
}

interface ConversationListProps {
  messages: Message[];
}

export default function ConversationList({ messages }: ConversationListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <div ref={scrollRef} className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[500px] scrollbar-thin scrollbar-thumb-accent">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
          <Bot className="w-12 h-12 mb-4 text-primary" />
          <p className="font-headline text-lg">No session data yet.</p>
          <p className="text-sm">Start by showing a diagram or asking a question!</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-3",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}
        >
          <Avatar className={cn("w-8 h-8", msg.role === "buddy" ? "bg-primary text-white" : "bg-muted")}>
            <AvatarFallback>{msg.role === "user" ? <User size={16}/> : <Bot size={16}/>}</AvatarFallback>
          </Avatar>
          
          <div className={cn(
            "flex flex-col max-w-[85%]",
            msg.role === "user" ? "items-end" : "items-start"
          )}>
            <Card className={cn(
              "p-3 text-sm shadow-sm",
              msg.role === "user" 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "bg-white text-foreground rounded-tl-none"
            )}>
              {msg.content}
              
              {msg.audioUrl && (
                <div className="mt-2 flex items-center gap-2 pt-2 border-t border-muted-foreground/20">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => playAudio(msg.audioUrl!)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] opacity-70">Buddy's voice</span>
                </div>
              )}
            </Card>
            
            {msg.imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border-2 border-accent shadow-md">
                <img src={msg.imageUrl} alt="AI Annotation" className="max-w-full h-auto" />
                <div className="bg-accent text-white px-2 py-1 text-[10px] flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>Dynamic Annotation</span>
                </div>
              </div>
            )}
            
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {msg.role === "user" ? "You" : "Study Buddy"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
