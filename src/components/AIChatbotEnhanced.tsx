
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Bot, User, Send, ArrowRight, AlertTriangle, Check, Database, ArrowUpRight, Upload, FileText } from "lucide-react";
import { getDatasets, runValidation, ValidationMethods, generateValidationReport } from "@/services/api";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your SODA Core assistant. How can I help you with your data validation needs today?",
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<ValidationSuggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      
      // Check for validation-related queries
      const isValidationQuery = 
        userInput.includes("validate") || 
        userInput.includes("check") || 
        userInput.includes("data quality") ||
        userInput.includes("analysis") ||
        userInput.includes("verification");
      
      // Check for dataset-related queries
      const isDatasetQuery = 
        userInput.includes("dataset") || 
        userInput.includes("data set") ||
        userInput.includes("file") ||
        userInput.includes("csv") ||
        userInput.includes("json") ||
        userInput.includes("table");
      
      // Generate appropriate response
      let response = "";
      
      if (isValidationQuery && isDatasetQuery) {
        // Fetch datasets to suggest validations
        const datasets = await getDatasets();
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
        } else {
          response = "I can help you validate your data, but I don't see any datasets in your system. Would you like to go to the datasets page to upload a file first?";
          
          // Add upload dataset suggestion
          setSuggestions([{
            datasetName: "Upload new dataset",
            datasetId: "upload",
            method: "upload",
            description: "Go to datasets page to upload a new file"
          }]);
        }
      } else if (userInput.includes("help") || userInput.includes("explain") || userInput.includes("how")) {
        response = "I can help you with several tasks:\n\n• Validate datasets for quality issues\n• Generate validation reports\n• Check for missing values or formatting issues\n• Navigate to different parts of the application\n\nWhat would you like to do?";
        
        // Add helpful action suggestions
        setSuggestions([
          {
            datasetName: "Run validation",
            datasetId: "validation",
            method: "navigate",
            description: "Go to validation page"
          },
          {
            datasetName: "View reports",
            datasetId: "reports",
            method: "navigate",
            description: "Go to reports page"
          },
          {
            datasetName: "Manage datasets",
            datasetId: "datasets",
            method: "navigate",
            description: "Go to datasets page"
          }
        ]);
      } else if (userInput.includes("thank")) {
        response = "You're welcome! I'm here to help with all your data validation needs. Let me know if you have any more questions.";
        setSuggestions([]);
      } else {
        response = "I can help you validate data, generate reports, or navigate to different sections of the app. What would you like to do?";
        
        // Add general action suggestions
        setSuggestions([
          {
            datasetName: "Run validation",
            datasetId: "validation",
            method: "navigate",
            description: "Go to validation page"
          },
          {
            datasetName: "View reports",
            datasetId: "reports",
            method: "navigate",
            description: "Go to reports page"
          },
          {
            datasetName: "Manage datasets",
            datasetId: "datasets",
            method: "navigate",
            description: "Go to datasets page"
          }
        ]);
      }
      
      const botMessage: Message = {
        id: `msg_${Date.now()}_bot`,
        content: response,
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    } finally {
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
          timestamp: new Date()
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
          timestamp: new Date()
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
        timestamp: new Date()
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[400px] p-0 flex flex-col h-full">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2 text-primary" />
              <SheetTitle>SODA Core Assistant</SheetTitle>
            </div>
            <SheetDescription className="text-xs">
              Ask about data validation, analysis, or reports
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
                      }`}>
                        <CardContent className="p-3">
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </CardContent>
                      </Card>
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
                  <div className="bg-muted rounded-full px-4 py-2 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce delay-150"></div>
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
                placeholder="Ask about data validation..."
                className="min-h-[60px] max-h-[120px]"
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

export default AIChatbotEnhanced;
