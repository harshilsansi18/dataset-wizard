
import React, { useState, useRef } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, Bot, Send, Lightbulb, HelpCircle, Search, 
  PanelLeftClose, Volume, VolumeX, PlusCircle, Sparkles
} from "lucide-react";
import { getDatasets, runValidation, ValidationMethods, generateValidationReport, getValidationReports } from "@/services/api";
import { useChatbot, ChatMessage } from '@/contexts/ChatbotContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ChatHistory from './ChatHistory';
import ChatSettings from './ChatSettings';
import SavedChats from './SavedChats';

const EnhancedChatbot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    isOpen, setIsOpen, pageContext, 
    messages, addMessage, clearMessages, 
    savedChats, currentChatId, saveCurrentChat, loadChat, deleteChat,
    isProcessing, setIsProcessing, isMuted, fontSize
  } = useChatbot();
  
  const [inputValue, setInputValue] = useState("");
  const [saveChatOpen, setSaveChatOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch reports when chat opens
  React.useEffect(() => {
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
    
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: inputValue,
      role: "user",
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    setInputValue("");
    setIsProcessing(true);
    
    try {
      // Play send sound if not muted
      playSound('send');
      
      // Process user message to find intents and keywords
      const userInput = userMessage.content.toLowerCase();
      
      // Check for navigation requests
      if (userInput.includes("go to validation") || userInput.includes("validate data") || userInput.includes("run validation")) {
        // Add a response message
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          content: "I'll take you to the validation page where you can run data validation checks.",
          role: "assistant",
          timestamp: new Date()
        };
        addMessage(botMessage);
        
        // Navigate after a short delay
        setTimeout(() => {
          navigate('/validation');
          setIsProcessing(false);
        }, 1000);
        return;
      }
      
      if (userInput.includes("go to reports") || userInput.includes("show reports") || userInput.includes("view reports")) {
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          content: "I'll take you to the reports page where you can see all validation reports.",
          role: "assistant",
          timestamp: new Date()
        };
        addMessage(botMessage);
        
        setTimeout(() => {
          navigate('/reports');
          setIsProcessing(false);
        }, 1000);
        return;
      }
      
      if (userInput.includes("go to datasets") || userInput.includes("view datasets") || userInput.includes("manage datasets")) {
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          content: "I'll take you to the datasets page where you can manage your data files.",
          role: "assistant",
          timestamp: new Date()
        };
        addMessage(botMessage);
        
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
          response = `I can help you validate your datasets. I've found ${datasets.length} datasets in your system. Would you like me to suggest a validation method?`;
          responseSuggestions = ["Run basic validation", "Check data completeness", "Check data formatting"];
        } else {
          response = "I can help you validate your data, but I don't see any datasets in your system. Would you like to go to the datasets page to upload a file first?";
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
        // New enhanced responses for general questions
        const responses = [
          "I can help you validate data, generate reports, or navigate to different sections of the app. What would you like to do?",
          "As your data assistant, I can analyze reports, check data quality, or help you understand validation results. What are you working on today?",
          "Need help with your data validation? I can show reports, run validations, or explain data quality concepts. What's your focus right now?"
        ];
        
        // Select a random response
        response = responses[Math.floor(Math.random() * responses.length)];
        
        // Add general action suggestions
        responseSuggestions = ["Run validation", "View reports", "Manage datasets", "Help me understand"];
      }
      
      // Add a slight delay to simulate thinking
      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          content: response,
          role: "assistant",
          timestamp: new Date(),
          suggestions: responseSuggestions,
          reportPreview: reportToShow
        };
        
        addMessage(botMessage);
        setIsProcessing(false);
        
        // Play receive sound if not muted
        playSound('receive');
      }, 700);
      
    } catch (error) {
      console.error("Error processing message:", error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: "I'm sorry, but I encountered an error processing your message. Please try again.",
        role: "assistant",
        timestamp: new Date(),
        isError: true,
        suggestions: ["Try again", "Help me troubleshoot"]
      };
      
      addMessage(errorMessage);
      setIsProcessing(false);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
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

  const handleFeedback = (messageId: string, positive: boolean) => {
    toast({
      title: positive ? "Feedback Received" : "Feedback Received",
      description: positive ? "Thank you for your positive feedback!" : "Thank you for your feedback. We'll work to improve our responses.",
    });
    
    // You could log feedback to analytics here
  };

  const handleViewReport = (report: any) => {
    // Store report ID in session storage to highlight it on reports page
    sessionStorage.setItem('highlightReportId', report.id);
    
    // Navigate to reports page
    navigate('/reports');
    setIsOpen(false);
  };

  const handleClearChat = () => {
    clearMessages();
    toast({
      title: "Chat Cleared",
      description: "Your conversation has been cleared."
    });
  };

  const handleOpenSaveDialog = () => {
    // Default title is based on first user message or current chat title
    const existingChat = currentChatId ? 
      savedChats.find(c => c.id === currentChatId) : null;
    
    if (existingChat) {
      setChatTitle(existingChat.title);
    } else {
      const userMessage = messages.find(m => m.role === 'user');
      if (userMessage) {
        setChatTitle(userMessage.content.slice(0, 30));
      } else {
        setChatTitle("New Chat");
      }
    }
    
    setSaveChatOpen(true);
  };

  const handleSaveChat = () => {
    saveCurrentChat(chatTitle);
    setSaveChatOpen(false);
    
    toast({
      title: "Chat Saved",
      description: "Your conversation has been saved."
    });
  };

  const handleExportChat = () => {
    try {
      // Create a blob with the chat data
      const chatData = {
        title: currentChatId ? 
          savedChats.find(c => c.id === currentChatId)?.title || "Exported Chat" : 
          "Exported Chat",
        timestamp: new Date(),
        messages: messages
      };
      
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Chat Exported",
        description: "Your conversation has been exported as JSON."
      });
    } catch (error) {
      console.error("Error exporting chat:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export your conversation.",
        variant: "destructive"
      });
    }
  };

  const handleImportChat = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const chatData = JSON.parse(event.target?.result as string);
        
        if (!chatData.messages || !Array.isArray(chatData.messages)) {
          throw new Error("Invalid chat data format");
        }
        
        // Convert string dates to Date objects
        const parsedMessages = chatData.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Add imported messages
        clearMessages();
        parsedMessages.forEach((msg: ChatMessage) => addMessage(msg));
        
        // Save as a new chat
        saveCurrentChat(chatData.title || "Imported Chat");
        
        toast({
          title: "Chat Imported",
          description: "The conversation was successfully imported."
        });
      } catch (error) {
        console.error("Error importing chat:", error);
        toast({
          title: "Import Failed",
          description: "Failed to import the conversation. The file format may be invalid.",
          variant: "destructive"
        });
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  // Function to play sound effects if not muted
  const playSound = (type: 'send' | 'receive') => {
    if (isMuted) return;
    
    // This could be enhanced to play actual sounds
    // For now just logging
    console.log(`Playing ${type} sound`);
  };

  const handleNewChat = () => {
    // If current chat has messages, prompt to save
    if (messages.length > 1) {
      toast({
        title: "Starting New Chat",
        description: "Your previous conversation has been cleared."
      });
    }
    
    clearMessages();
  };

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
                  <SheetTitle className="flex items-center">
                    AI Assistant
                    {isMuted ? (
                      <VolumeX className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
                    ) : (
                      <Volume className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-xs mt-0">
                    Chat about reports, validation, and data quality
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* History Button - Saved Chats */}
                <SavedChats 
                  savedChats={savedChats}
                  currentChatId={currentChatId}
                  onSelectChat={loadChat}
                  onDeleteChat={deleteChat}
                  onRenameChat={(chatId, newTitle) => {
                    const chat = savedChats.find(c => c.id === chatId);
                    if (chat) {
                      saveCurrentChat(newTitle);
                    }
                  }}
                />
                
                {/* Settings Button */}
                <ChatSettings 
                  onClearChat={handleClearChat}
                  onSaveChat={handleOpenSaveDialog}
                  onExportChat={handleExportChat}
                  onImportChat={handleImportChat}
                />
                
                {/* New Chat Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={handleNewChat}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                
                {pageContext && (
                  <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {pageContext.charAt(0).toUpperCase() + pageContext.slice(1)} View
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Search bar */}
            <div className="mt-3 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-background/80"
              />
            </div>
          </SheetHeader>
          
          {/* Chat Messages History */}
          <ChatHistory
            messages={messages.filter(msg => 
              searchTerm ? msg.content.toLowerCase().includes(searchTerm.toLowerCase()) : true
            )}
            isProcessing={isProcessing}
            onSuggestionClick={handleSuggestionClick}
            onFeedback={handleFeedback}
            onViewReport={handleViewReport}
            fontSize={fontSize}
            showHelp={messages.length <= 2}
          />
          
          <div className="p-4 border-t bg-gradient-to-b from-muted/10 to-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                placeholder="Ask about reports, validation, datasets..."
                className="min-h-[60px] max-h-[120px] resize-none bg-muted/50 border-primary/20 focus-visible:ring-primary/30"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isProcessing}
              />
              <Button
                type="submit"
                size="icon"
                className={`
                  h-[60px] shrink-0 transition-colors
                  ${inputValue.trim() ? 'bg-primary/90 hover:bg-primary' : 'bg-muted hover:bg-muted/80'} 
                `}
                disabled={isProcessing || !inputValue.trim()}
              >
                <Send className={`h-5 w-5 ${!inputValue.trim() ? 'text-muted-foreground' : ''}`} />
              </Button>
            </form>
            
            <div className="flex justify-center mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground flex items-center hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={() => handleSuggestionClick("Help me understand data validation")}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Need help with data validation?
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Hidden file input for importing chats */}
      <input 
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileUpload}
      />
      
      {/* Save Chat Dialog */}
      <Dialog open={saveChatOpen} onOpenChange={setSaveChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Conversation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Chat Title</label>
            <Input
              placeholder="Enter a title for this chat"
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveChatOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChat}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedChatbot;
