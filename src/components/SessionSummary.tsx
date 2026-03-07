
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { FileText, Lightbulb, Target } from "lucide-react";

interface SummaryProps {
  summary: {
    topics: string[];
    keyTakeaways: string[];
    furtherStudy: string[];
  };
}

export default function SessionSummary({ summary }: SummaryProps) {
  return (
    <Card className="border-accent/30 shadow-lg overflow-hidden">
      <CardHeader className="bg-accent/10 border-b border-accent/20">
        <CardTitle className="text-lg font-headline flex items-center gap-2 text-accent-foreground">
          <FileText className="w-5 h-5" />
          Session Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Topics Covered
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.topics.map((t, i) => (
              <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Key Insights
          </h4>
          <ul className="space-y-1">
            {summary.keyTakeaways.map((k, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
