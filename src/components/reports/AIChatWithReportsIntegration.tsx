
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Bot, User, Send, FileText, BarChart, Calendar, ArrowUpRight } from "lucide-react";
import { getValidationReports, ValidationReport } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  reportPreview?: ValidationReport;
};

const AIChatWithReportsIntegration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your report assistant. I can help you analyze validation reports, find issues, and provide recommendations.",
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [reports, setReports] = useState<ValidationReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch reports when chat opens
  useEffect(() => {
    if (isOpen && reports.length === 0) {
      fetchReports();
    }
  }, [isOpen]);

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const data = await getValidationReports();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: inputValue,
      role: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);
    
    try {
      // Process user message
      const userInput = inputValue.toLowerCase();
      
      // Determine intent from user message
      const isReportRequest = 
        userInput.includes('report') || 
        userInput.includes('validation') ||
        userInput.includes('analysis') ||
        userInput.includes('result');
        
      const isHelpRequest = 
        userInput.includes('help') || 
        userInput.includes('how') ||
        userInput.includes('what');
        
      const isLatestRequest = 
        userInput.includes('latest') || 
        userInput.includes('recent') ||
        userInput.includes('new');
        
      const isErrorRequest =
        userInput.includes('error') ||
        userInput.includes('fail') ||
        userInput.includes('issue');

      let response = "";
      let reportToShow: ValidationReport | undefined = undefined;
      
      // Handle different intents
      if (isReportRequest) {
        if (reports.length === 0) {
          response = "I don't see any reports available. Would you like to run a new validation?";
        } else {
          if (isLatestRequest) {
            // Get most recent report
            const latestReport = [...reports].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];
            
            response = `Here's the latest report for "${latestReport.datasetName}" from ${format(new Date(latestReport.timestamp), 'MMMM d, yyyy')}. It had ${latestReport.summary.fail} failed checks, ${latestReport.summary.warning} warnings, and ${latestReport.summary.pass} passing checks.`;
            reportToShow = latestReport;
          } 
          else if (isErrorRequest) {
            // Find report with most errors
            const errorReport = [...reports].sort((a, b) => b.summary.fail - a.summary.fail)[0];
            
            response = `I found a report for "${errorReport.datasetName}" with the most validation errors. It has ${errorReport.summary.fail} failed checks that need attention.`;
            reportToShow = errorReport;
          }
          else {
            // General report summary
            response = `I found ${reports.length} validation reports. Would you like to see a specific one or the most recent?`;
          }
        }
      } else if (isHelpRequest) {
        response = "I can help you analyze validation reports, find issues in your data, and provide recommendations. Try asking questions like:\n\n• Show me my latest report\n• Are there any reports with errors?\n• Summarize validation results\n• What are the most common data issues?";
      } else {
        response = "I'm your data validation assistant. I can help you review reports, find issues, and navigate reports. Try asking about your validation reports or data quality issues.";
      }
      
      // Add AI response
      const botMessage: Message = {
        id: `msg_${Date.now()}_bot`,
        content: response,
        role: "assistant",
        timestamp: new Date(),
        reportPreview: reportToShow
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsProcessing(false);
      }, 700);
      
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleViewReport = (report: ValidationReport) => {
    // Store report ID in session storage to highlight it on reports page
    sessionStorage.setItem('highlightReportId', report.id);
    
    // Navigate to reports page
    navigate('/reports');
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/10"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[400px] p-0 flex flex-col h-full border-l shadow-lg">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2 text-primary" />
              <SheetTitle>Report Assistant</SheetTitle>
            </div>
            <SheetDescription className="text-xs">
              Chat about reports and data validation results
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className={`h-8 w-8 ${msg.role === "user" ? "bg-primary" : "bg-muted"}`}>
                      {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </Avatar>
                    <div>
                      <Card className={`${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      } p-3 shadow-sm`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </Card>
                      
                      {/* Report preview card */}
                      {msg.reportPreview && (
                        <Card className="mt-2 overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewReport(msg.reportPreview!)}>
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium truncate">{msg.reportPreview.datasetName}</div>
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(msg.reportPreview.timestamp), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                                {msg.reportPreview.summary.pass} Pass
                              </Badge>
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">
                                {msg.reportPreview.summary.fail} Fail
                              </Badge>
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
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
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 bg-muted">
                      <Bot className="h-5 w-5" />
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce delay-75"></div>
                      <div className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Auto scroll to bottom */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                placeholder="Ask about reports or validation results..."
                className="min-h-[60px] max-h-[120px] resize-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isProcessing}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[60px] shrink-0"
                disabled={isProcessing || !inputValue.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AIChatWithReportsIntegration;
