
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
import { MessageSquare, Bot, User, Send, FileText, BarChart, Calendar, ArrowUpRight, Search, RefreshCw, ChevronRight, ThumbsUp, ThumbsDown, Lightbulb, HelpCircle } from "lucide-react";
import { getValidationReports, ValidationReport } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  reportPreview?: ValidationReport;
  suggestions?: string[];
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
      timestamp: new Date(),
      suggestions: ["Show latest report", "Find reports with errors", "Summarize all reports", "Help me interpret results"]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [reports, setReports] = useState<ValidationReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      toast({
        title: "Error",
        description: "Failed to fetch reports. Please try again later.",
        variant: "destructive"
      });
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
      
      const isComparisonRequest =
        userInput.includes('compare') ||
        userInput.includes('difference') ||
        userInput.includes('vs') ||
        userInput.includes('versus');
      
      const isChartRequest = 
        userInput.includes('chart') ||
        userInput.includes('graph') ||
        userInput.includes('visualization') ||
        userInput.includes('visualize');
      
      const isSummaryRequest = 
        userInput.includes('summary') ||
        userInput.includes('summarize') ||
        userInput.includes('overview');

      let response = "";
      let reportToShow: ValidationReport | undefined = undefined;
      let suggestions: string[] = [];
      
      // Handle different intents
      if (isReportRequest) {
        if (reports.length === 0) {
          response = "I don't see any reports available. Would you like to run a new validation?";
          suggestions = ["Run new validation", "Go to validation page"];
        } else {
          if (isLatestRequest) {
            // Get most recent report
            const latestReport = [...reports].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];
            
            response = `Here's the latest report for "${latestReport.datasetName}" from ${format(new Date(latestReport.timestamp), 'MMMM d, yyyy')}. It had ${latestReport.summary.fail} failed checks, ${latestReport.summary.warning} warnings, and ${latestReport.summary.pass} passing checks.`;
            reportToShow = latestReport;
            suggestions = ["Show me details", "Find errors", "Compare with previous"];
          } 
          else if (isErrorRequest) {
            // Find report with most errors
            const errorReport = [...reports].sort((a, b) => b.summary.fail - a.summary.fail)[0];
            
            response = `I found a report for "${errorReport.datasetName}" with the most validation errors. It has ${errorReport.summary.fail} failed checks that need attention.`;
            reportToShow = errorReport;
            suggestions = ["Show error details", "How to fix these?", "Run new validation"];
          }
          else if (isComparisonRequest) {
            if (reports.length >= 2) {
              const sortedReports = [...reports].sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              
              const latest = sortedReports[0];
              const previous = sortedReports[1];
              
              const failDiff = latest.summary.fail - previous.summary.fail;
              const passDiff = latest.summary.pass - previous.summary.pass;
              
              response = `Comparing the latest two reports:
              
Latest (${format(new Date(latest.timestamp), 'MMM d')}): ${latest.summary.pass} passed, ${latest.summary.fail} failed
Previous (${format(new Date(previous.timestamp), 'MMM d')}): ${previous.summary.pass} passed, ${previous.summary.fail} failed

${failDiff > 0 ? `⚠️ Failures increased by ${failDiff}` : failDiff < 0 ? `✅ Failures decreased by ${Math.abs(failDiff)}` : 'No change in failures'}
${passDiff > 0 ? `✅ Passes increased by ${passDiff}` : passDiff < 0 ? `⚠️ Passes decreased by ${Math.abs(passDiff)}` : 'No change in passes'}`;
              
              reportToShow = latest;
              suggestions = ["View latest report", "View previous report", "What caused changes?"];
            } else {
              response = "I need at least two reports to make a comparison. There's only one report available.";
              suggestions = ["Show available report", "Run new validation"];
            }
          }
          else if (isChartRequest) {
            response = "I can help you visualize your validation results. Would you like to see charts for a specific report or trends across all reports?";
            suggestions = ["Latest report charts", "Error trend charts", "Data quality trends"];
          }
          else if (isSummaryRequest) {
            const totalReports = reports.length;
            const totalChecks = reports.reduce((sum, report) => 
              sum + report.summary.pass + report.summary.fail + report.summary.warning, 0);
            const totalFailures = reports.reduce((sum, report) => sum + report.summary.fail, 0);
            
            const recentReports = reports
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 3);
            
            response = `Summary of All Validation Reports:

📊 ${totalReports} total reports with ${totalChecks} validation checks performed
❌ ${totalFailures} total failures identified across all reports
🔍 Most recent validation: ${recentReports[0] ? recentReports[0].datasetName + ' (' + format(new Date(recentReports[0].timestamp), 'MMM d') + ')' : 'None'}`;
            
            suggestions = ["Show recent reports", "Reports with errors", "Data quality trends"];
          }
          else {
            // General report summary
            response = `I found ${reports.length} validation reports. Would you like to see a specific one or the most recent?`;
            suggestions = ["Show latest report", "Show reports with errors", "Compare reports"];
          }
        }
      } else if (isHelpRequest) {
        response = "I can help you analyze validation reports, find issues in your data, and provide recommendations. Try asking questions like:\n\n• Show me my latest report\n• Are there any reports with errors?\n• Summarize validation results\n• What are the most common data issues?\n• Compare latest reports";
        suggestions = ["Show latest report", "Find reports with errors", "Get recommendations"];
      } else {
        response = "I'm your data validation assistant. I can help you review reports, find issues, and navigate reports. Try asking about your validation reports or data quality issues.";
        suggestions = ["Show latest report", "Search for errors", "Get help interpreting results"];
      }
      
      // Add AI response
      const botMessage: Message = {
        id: `msg_${Date.now()}_bot`,
        content: response,
        role: "assistant",
        timestamp: new Date(),
        reportPreview: reportToShow,
        suggestions: suggestions
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

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleFeedback = (positive: boolean) => {
    toast({
      title: positive ? "Feedback Received" : "Feedback Received",
      description: positive ? "Thank you for your positive feedback!" : "Thank you for your feedback. We'll work to improve our responses.",
    });
  };

  const filteredReports = searchTerm.trim() === "" 
    ? reports 
    : reports.filter(report => {
        const searchLower = searchTerm.toLowerCase();
        return (
          report.datasetName.toLowerCase().includes(searchLower) ||
          report.results.some(r => 
            r.check.toLowerCase().includes(searchLower) ||
            r.details.toLowerCase().includes(searchLower) ||
            r.status.toLowerCase().includes(searchLower)
          )
        );
      });

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg border-primary/20 bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-all duration-300 animate-fade-in"
          >
            <MessageSquare className="h-6 w-6 text-primary" />
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[400px] p-0 flex flex-col h-full border-l shadow-lg">
          <SheetHeader className="px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2 bg-primary/20">
                  <Bot className="h-5 w-5 text-primary" />
                </Avatar>
                <div>
                  <SheetTitle>Report Assistant</SheetTitle>
                  <SheetDescription className="text-xs mt-0">
                    Chat about reports and data validation results
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={fetchReports} 
                  className="h-8 w-8 rounded-full" 
                  disabled={isLoadingReports}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
                </Button>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {reports.length} Reports
                </Badge>
              </div>
            </div>
            
            {/* Search bar */}
            <div className="mt-3 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 h-9 rounded-md border border-input bg-background/80 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </SheetHeader>
          
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
                    <Avatar className={`h-8 w-8 ${msg.role === "user" ? "bg-primary" : "bg-muted"} shadow-sm`}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </Avatar>
                    <div className="space-y-2 max-w-[calc(100%-36px)]">
                      <Card className={cn(
                        "p-3 shadow-sm",
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground border-primary/10" 
                          : "bg-muted border-muted/10"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Feedback buttons - only show for assistant messages */}
                        {msg.role === "assistant" && (
                          <div className="flex justify-end mt-2 gap-2 opacity-70">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full hover:bg-background/20" 
                              onClick={() => handleFeedback(true)}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full hover:bg-background/20" 
                              onClick={() => handleFeedback(false)}
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
                              onClick={() => handleSuggestionClick(suggestion)}
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
                          onClick={() => handleViewReport(msg.reportPreview!)}
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
              
              {/* Auto scroll to bottom */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Help tips section */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-dashed border-muted bg-muted/30">
              <div className="flex items-center mb-2 text-sm font-medium text-muted-foreground">
                <Lightbulb className="h-4 w-4 mr-1.5 text-amber-500" />
                <span>Try asking:</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {["Show my latest report", "Find reports with errors", "Compare latest reports"].map((tip, i) => (
                  <Button 
                    key={i} 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start text-xs h-auto py-1.5 px-2 hover:bg-primary/10 hover:text-primary transition-colors" 
                    onClick={() => handleSuggestionClick(tip)}
                  >
                    <ChevronRight className="h-3 w-3 mr-1 text-primary" />
                    {tip}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-4 border-t bg-gradient-to-b from-muted/10 to-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                placeholder="Ask about reports or validation results..."
                className="min-h-[60px] max-h-[120px] resize-none bg-muted/50 border-primary/20 focus-visible:ring-primary/30"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isProcessing}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[60px] shrink-0 bg-primary/90 hover:bg-primary transition-colors"
                disabled={isProcessing || !inputValue.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            
            <div className="flex justify-center mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground flex items-center hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={() => handleSuggestionClick("Help me understand these reports")}
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Need help analyzing reports?
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AIChatWithReportsIntegration;
