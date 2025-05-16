
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ChatMessage } from '@/contexts/ChatbotContext';
import { cn } from "@/lib/utils";
import { 
  Bot, User, ThumbsUp, ThumbsDown, ArrowUpRight, Calendar, 
  ChevronRight, RefreshCw 
} from "lucide-react";
import { format } from 'date-fns';

interface ChatHistoryProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (messageId: string, positive: boolean) => void;
  onViewReport: (report: any) => void;
  fontSize: "small" | "medium" | "large";
  showHelp: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  isProcessing,
  onSuggestionClick,
  onFeedback,
  onViewReport,
  fontSize,
  showHelp
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const getFontSize = () => {
    switch (fontSize) {
      case "small": return "text-xs";
      case "large": return "text-base";
      default: return "text-sm";
    }
  };

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-fade-in ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className={cn(
                "h-8 w-8 shadow-sm",
                msg.role === "user" ? "bg-primary" : "bg-muted"
              )}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </Avatar>
              <div className="space-y-2 max-w-[calc(100%-36px)]">
                <Card className={cn(
                  "p-3 shadow-sm",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground border-primary/10" 
                    : msg.isError 
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-muted border-muted/10"
                )}>
                  <p className={cn(
                    "whitespace-pre-wrap", 
                    getFontSize()
                  )}>
                    {msg.content}
                  </p>
                  
                  {/* Feedback buttons - only show for assistant messages */}
                  {msg.role === "assistant" && (
                    <div className="flex justify-end mt-2 gap-2 opacity-70">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-background/20" 
                        onClick={() => onFeedback(msg.id, true)}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-background/20" 
                        onClick={() => onFeedback(msg.id, false)}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </Card>
                
                {/* Quick reply suggestions */}
                {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.suggestions.map((suggestion, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm" 
                        className="text-xs py-1 h-auto bg-background/80 shadow-sm border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => onSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Report preview card */}
                {msg.reportPreview && (
                  <Card 
                    className="mt-2 overflow-hidden border border-primary/20 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-card/90 hover:bg-card" 
                    onClick={() => onViewReport(msg.reportPreview)}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-sm font-medium truncate text-primary">{msg.reportPreview.datasetName}</div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(msg.reportPreview.timestamp), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex gap-2 mt-1.5">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                          {msg.reportPreview.summary.pass} Pass
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                          {msg.reportPreview.summary.fail} Fail
                        </Badge>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                          {msg.reportPreview.summary.warning} Warning
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )}
                
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-muted">
                <Bot className="h-4 w-4" />
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Help tips section */}
        {showHelp && (
          <div className="rounded-lg border border-dashed border-muted p-3 bg-muted/20 mt-4">
            <div className="flex items-center mb-2 text-sm font-medium text-muted-foreground">
              <RefreshCw className="h-4 w-4 mr-1.5 text-primary" />
              <span>Try asking:</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {[
                "Show my latest report", 
                "Find reports with errors", 
                "Compare latest reports",
                "Help me understand data quality"
              ].map((tip, i) => (
                <Button 
                  key={i} 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start text-xs h-auto py-1.5 px-2 hover:bg-primary/10 hover:text-primary transition-colors" 
                  onClick={() => onSuggestionClick(tip)}
                >
                  <ChevronRight className="h-3 w-3 mr-1 text-primary" />
                  {tip}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Auto scroll to bottom */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatHistory;
