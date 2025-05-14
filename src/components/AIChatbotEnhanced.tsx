
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, Bot, User, Send, ArrowRight, AlertTriangle, 
  Check, Database, ArrowUpRight, Upload, FileText, ThumbsUp, 
  ThumbsDown, Lightbulb, HelpCircle, Search, ChevronRight, 
  RefreshCw, Calendar
} from "lucide-react";
import { getDatasets, runValidation, ValidationMethods, generateValidationReport, getValidationReports } from "@/services/api";
import { useChatbot } from '@/contexts/ChatbotContext';
import { format } from 'date-fns';

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  suggestions?: string[];
  reportPreview?: any;
};

type ValidationSuggestion = {
  datasetName: string;
  datasetId: string;
  method: string;
  description: string;
};

const AIChatbotEnhanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOpen, setIsOpen, pageContext } = useChatbot();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your SODA Core assistant. How can I help you with your data validation needs today?",
      role: "assistant",
      timestamp: new Date(),
      suggestions: ["Show latest report", "Validate a dataset", "Help me understand reports"]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<ValidationSuggestion[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch data when bot opens
  useEffect(() => {
    if (isOpen) {
      // Add a page-specific greeting based on context
      if (pageContext && messages.length === 1) {
        let pageGreeting = "";
        let pageSuggestions: string[] = [];
        
        switch(pageContext) {
          case "reports":
            pageGreeting = "I see you're looking at reports! How can I help you analyze your validation results?";
            pageSuggestions = ["Show latest report", "Find reports with errors", "Summarize all reports"];
            fetchReports();
            break;
          case "validation":
            pageGreeting = "Looking to validate some data? I can help you set up validations or interpret results.";
            pageSuggestions = ["Run basic validation", "Check data completeness", "Help me choose a method"];
            fetchDatasets();
            break;
          case "datasets":
            pageGreeting = "Need help with your datasets? I can assist with uploading, organizing, or validating them.";
            pageSuggestions = ["Upload a new dataset", "Validate a dataset", "Manage my files"];
            fetchDatasets();
            break;
          default:
            return;
        }
        
        const contextMessage: Message = {
          id: `context_${Date.now()}`,
          content: pageGreeting,
          role: "assistant",
          timestamp: new Date(),
          suggestions: pageSuggestions
        };
        
        setMessages(prev => [prev[0], contextMessage]);
      }
    }
  }, [isOpen, pageContext]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  const fetchDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    } finally {
      setIsLoadingDatasets(false);
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
      // Process user message to find intents and keywords
      const userInput = userMessage.content.toLowerCase();
      
      // Check for navigation requests
      if (userInput.includes("go to validation") || userInput.includes("validate data") || userInput.includes("run validation")) {
        // Add a response message
        const botMessage: Message = {
          id: `msg_${Date.now()}_bot`,
          content: "I'll take you to the validation page where you can run data validation checks.",
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Navigate after a short delay
        setTimeout(() => {
          navigate('/validation');
          setIsProcessing(false);
        }, 1000);
        return;
      }
      
      if (userInput.includes("go to reports") || userInput.includes("show reports") || userInput.includes("view reports")) {
        const botMessage: Message = {
          id: `msg_${Date.now()}_bot`,
          content: "I'll take you to the reports page where you can see all validation reports.",
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        
        setTimeout(() => {
          navigate('/reports');
          setIsProcessing(false);
        }, 1000);
        return;
      }
      
      if (userInput.includes("go to datasets") || userInput.includes("view datasets") || userInput.includes("manage datasets")) {
        const botMessage: Message = {
          id: `msg_${Date.now()}_bot`,
          content: "I'll take you to the datasets page where you can manage your data files.",
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        
        setTimeout(() => {
          navigate('/datasets');
          setIsProcessing(false);
        }, 1000);
        return;
      }
      
      // Report-specific queries
      const isReportQuery = 
        userInput.includes('report') || 
        userInput.includes('validation results') ||
        userInput.includes('analysis');
        
      const isLatestReportRequest = 
        userInput.includes('latest') || 
        userInput.includes('recent');
        
      const isErrorReportRequest =
        userInput.includes('error') ||
        userInput.includes('fail') ||
        userInput.includes('issue');
      
      const isComparisonRequest =
        userInput.includes('compare') ||
        userInput.includes('difference');
      
      const isSummaryRequest = 
        userInput.includes('summary') ||
        userInput.includes('summarize') ||
        userInput.includes('overview');

      // Validation-related queries
      const isValidationQuery = 
        userInput.includes("validate") || 
        userInput.includes("check") || 
        userInput.includes("quality") ||
        userInput.includes("analysis");
      
      // Dataset-related queries
      const isDatasetQuery = 
        userInput.includes("dataset") || 
        userInput.includes("data") ||
        userInput.includes("file") ||
        userInput.includes("csv");

      // Generate appropriate response
      let response = "";
      let responseSuggestions: string[] = [];
      let reportToShow: any | undefined = undefined;
      
      // Handle different types of queries
      if (isReportQuery && reports.length > 0) {
        // Fetch reports if needed
        if (reports.length === 0) {
          await fetchReports();
        }
        
        if (isLatestReportRequest) {
          // Get most recent report
          const latestReport = [...reports].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          if (latestReport) {
            response = `Here's the latest report for "${latestReport.datasetName}" from ${format(new Date(latestReport.timestamp), 'MMMM d, yyyy')}. It had ${latestReport.summary.fail} failed checks, ${latestReport.summary.warning} warnings, and ${latestReport.summary.pass} passing checks.`;
            reportToShow = latestReport;
            responseSuggestions = ["Show me details", "Find errors", "Compare with previous"];
          } else {
            response = "I couldn't find any reports in the system.";
          }
        } 
        else if (isErrorReportRequest) {
          // Find report with most errors
          const errorReport = [...reports].sort((a, b) => b.summary.fail - a.summary.fail)[0];
          
          if (errorReport) {
            response = `I found a report for "${errorReport.datasetName}" with the most validation errors. It has ${errorReport.summary.fail} failed checks that need attention.`;
            reportToShow = errorReport;
            responseSuggestions = ["Show error details", "How to fix these?", "Run new validation"];
          } else {
            response = "I couldn't find any reports with errors.";
          }
        }
        else if (isComparisonRequest && reports.length >= 2) {
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
          responseSuggestions = ["View latest report", "View previous report", "What caused changes?"];
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
          
          responseSuggestions = ["Show recent reports", "Reports with errors", "Data quality trends"];
        }
        else {
          // General report summary
          response = `I found ${reports.length} validation reports. Would you like to see a specific one or the most recent?`;
          responseSuggestions = ["Show latest report", "Show reports with errors", "Compare reports"];
        }
      }
      else if (isValidationQuery && isDatasetQuery) {
        // Fetch datasets if needed
        if (datasets.length === 0) {
          await fetchDatasets();
        }
        
        if (datasets.length > 0) {
          // Create validation suggestions
          const validationSuggestions: ValidationSuggestion[] = datasets.slice(0, 3).map(dataset => {
            // Choose a validation method based on user query
            let method = ValidationMethods.BASIC;
            if (userInput.includes("format") || userInput.includes("pattern")) {
              method = ValidationMethods.FORMAT_CHECKS;
            } else if (userInput.includes("missing") || userInput.includes("complete")) {
              method = ValidationMethods.DATA_COMPLETENESS;
            } else if (userInput.includes("statistic") || userInput.includes("outlier")) {
              method = ValidationMethods.STATISTICAL_ANALYSIS;
            } else if (userInput.includes("quality")) {
              method = ValidationMethods.DATA_QUALITY;
            } else if (userInput.includes("text") || userInput.includes("string")) {
              method = ValidationMethods.TEXT_ANALYSIS;
            }
            
            return {
              datasetName: dataset.name,
              datasetId: dataset.id,
              method,
              description: `Run ${method.replace('_', ' ')} validation on ${dataset.name}`
            };
          });
          
          setSuggestions(validationSuggestions);
          response = `I can help you validate your datasets. I've found ${datasets.length} datasets in your system. Click on a suggestion to run validation:`;
          responseSuggestions = [];
        } else {
          response = "I can help you validate your data, but I don't see any datasets in your system. Would you like to go to the datasets page to upload a file first?";
          
          // Add upload dataset suggestion
          setSuggestions([{
            datasetName: "Upload new dataset",
            datasetId: "upload",
            method: "upload",
            description: "Go to datasets page to upload a new file"
          }]);
          responseSuggestions = ["Go to datasets page", "Tell me about validation methods"];
        }
      } else if (userInput.includes("help") || userInput.includes("explain") || userInput.includes("how")) {
        response = "I can help you with several tasks:\n\n• Validate datasets for quality issues\n• Generate validation reports\n• Check for missing values or formatting issues\n• Navigate to different parts of the application\n\nWhat would you like to do?";
        
        // Add helpful action suggestions
        responseSuggestions = ["Show latest report", "Run data validation", "Understand validation methods", "Analyze data quality"];
      } else if (userInput.includes("thank")) {
        response = "You're welcome! I'm here to help with all your data validation needs. Let me know if you have any more questions.";
        responseSuggestions = ["What can you help with?"];
      } else {
        response = "I can help you validate data, generate reports, or navigate to different sections of the app. What would you like to do?";
        
        // Add general action suggestions
        responseSuggestions = ["Run validation", "View reports", "Manage datasets", "Help me understand"];
      }
      
      const botMessage: Message = {
        id: `msg_${Date.now()}_bot`,
        content: response,
        role: "assistant",
        timestamp: new Date(),
        suggestions: responseSuggestions,
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

  const handleRunValidation = async (suggestion: ValidationSuggestion) => {
    try {
      setIsProcessing(true);
      
      // Handle navigation suggestions
      if (suggestion.method === "navigate" || suggestion.datasetId === "validation" || 
          suggestion.datasetId === "reports" || suggestion.datasetId === "datasets") {
        
        // Add a new message showing the navigation
        const userMessage: Message = {
          id: `msg_${Date.now()}_nav`,
          content: `Go to ${suggestion.description.split(" ")[2]} page`,
          role: "user",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Add response
        const botMessage: Message = {
          id: `msg_${Date.now()}_navresponse`,
          content: `Taking you to the ${suggestion.description.split(" ")[2]} page...`,
          role: "assistant",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Navigate to the appropriate page
        setTimeout(() => {
          if (suggestion.datasetId === "validation") {
            navigate('/validation');
          } else if (suggestion.datasetId === "reports") {
            navigate('/reports');
          } else if (suggestion.datasetId === "datasets") {
            navigate('/datasets');
          }
          setIsProcessing(false);
        }, 1000);
        
        return;
      }
      
      // Handle upload dataset suggestion
      if (suggestion.method === "upload" || suggestion.datasetId === "upload") {
        const userMessage: Message = {
          id: `msg_${Date.now()}_upload`,
          content: "Upload a new dataset",
          role: "user",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        const botMessage: Message = {
          id: `msg_${Date.now()}_uploadresponse`,
          content: "Taking you to the datasets page where you can upload a new file...",
          role: "assistant",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        setTimeout(() => {
          navigate('/datasets');
          setIsProcessing(false);
        }, 1000);
        
        return;
      }
      
      // Add a new message from the user
      const userMessage: Message = {
        id: `msg_${Date.now()}_run`,
        content: `Run ${suggestion.method.replace('_', ' ')} on "${suggestion.datasetName}"`,
        role: "user",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Add running message
      const botMessage: Message = {
        id: `msg_${Date.now()}_running`,
        content: `Starting ${suggestion.method.replace('_', ' ')} validation on "${suggestion.datasetName}"...`,
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Run the actual validation
      const validationResults = await runValidation(suggestion.datasetId, suggestion.method);
      
      // Generate a report from the validation results
      if (validationResults && validationResults.length > 0) {
        // Get the dataset name from the suggestion
        const reportData = await generateValidationReport(
          suggestion.datasetId,
          suggestion.datasetName,
          validationResults
        );

        // Success message with report details
        const resultMessage: Message = {
          id: `msg_${Date.now()}_result`,
          content: `Validation complete! 
          
The ${suggestion.method.replace('_', ' ')} validation on "${suggestion.datasetName}" found:
- ${validationResults.filter(r => r.status === "Pass").length} passing checks
- ${validationResults.filter(r => r.status === "Fail").length} failing checks
- ${validationResults.filter(r => r.status === "Warning").length} warnings

A report has been generated. Would you like to view it?`,
          role: "assistant",
          timestamp: new Date(),
          suggestions: ["View the report", "Run another validation", "Help me understand results"]
        };
        
        setMessages(prev => [...prev, resultMessage]);
        
        // Add report suggestion
        setSuggestions([{
          datasetName: "View Report",
          datasetId: "reports",
          method: "navigate",
          description: "Go to reports page"
        }]);
      } else {
        // Error message if no results
        const errorMessage: Message = {
          id: `msg_${Date.now()}_error`,
          content: `The validation was run but didn't produce any results. This might be an issue with the dataset or validation method.`,
          role: "assistant",
          timestamp: new Date(),
          suggestions: ["Try different validation", "Upload another dataset", "Get help"]
        };
        
        setMessages(prev => [...prev, errorMessage]);
        setSuggestions([]);
      }
      
      toast({
        title: "Validation Complete",
        description: `Validation has been run on "${suggestion.datasetName}"`,
      });
      
    } catch (error) {
      console.error("Error running validation:", error);
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        content: `I'm sorry, but there was an error running the validation. Please try again or check the dataset.`,
        role: "assistant",
        timestamp: new Date(),
        suggestions: ["Try again", "Try different dataset", "Go to validation page"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Validation Error",
        description: "Failed to run validation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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

  const handleViewReport = (report: any) => {
    // Store report ID in session storage to highlight it on reports page
    sessionStorage.setItem('highlightReportId', report.id);
    
    // Navigate to reports page
    navigate('/reports');
    setIsOpen(false);
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
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-primary" />
                <SheetTitle>SODA Core Assistant</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    fetchReports();
                    fetchDatasets();
                  }} 
                  className="h-8 w-8" 
                  disabled={isLoadingReports || isLoadingDatasets}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingReports || isLoadingDatasets ? 'animate-spin' : ''}`} />
                </Button>
                {pageContext && (
                  <Badge variant="outline" className="bg-primary/10">
                    {pageContext.charAt(0).toUpperCase() + pageContext.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
            <SheetDescription className="text-xs mt-1">
              Chat about reports, validation, and data quality
            </SheetDescription>
            
            {/* Search bar */}
            <div className="mt-2 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages
                .filter(msg => searchTerm 
                  ? msg.content.toLowerCase().includes(searchTerm.toLowerCase()) 
                  : true)
                .map((msg) => (
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
                    <div className="space-y-2">
                      <Card className={`${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      } p-3 shadow-sm`}>
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
                              className="text-xs py-1 h-auto bg-background shadow-sm hover:bg-accent"
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
                          className="mt-2 overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                          onClick={() => handleViewReport(msg.reportPreview)}
                        >
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
              
              {/* Validation suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Suggested actions:
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleRunValidation(suggestion)}
                        disabled={isProcessing}
                      >
                        <div className="mr-2">
                          {suggestion.method === "upload" ? (
                            <Upload className="h-4 w-4" />
                          ) : suggestion.method === "navigate" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : suggestion.method === ValidationMethods.BASIC ? (
                            <Check className="h-4 w-4" />
                          ) : suggestion.method === ValidationMethods.DATA_COMPLETENESS ? (
                            <Database className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{suggestion.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.datasetName}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
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
          
          {/* Help tips section */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-dashed border-muted">
              <div className="flex items-center mb-2 text-sm font-medium text-muted-foreground">
                <Lightbulb className="h-4 w-4 mr-1.5 text-amber-500" />
                <span>Try asking:</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {["Show my latest report", "Find reports with errors", "Validate my dataset"].map((tip, i) => (
                  <Button 
                    key={i} 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start text-xs h-auto py-1.5 px-2" 
                    onClick={() => handleSuggestionClick(tip)}
                  >
                    <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground" />
                    {tip}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                placeholder="Ask about reports, validation, datasets..."
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
            
            <div className="flex justify-center mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground flex items-center"
                onClick={() => handleSuggestionClick("Help me understand data validation")}
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Need help with data validation?
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AIChatbotEnhanced;
