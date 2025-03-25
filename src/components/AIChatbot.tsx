
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, Minimize, Maximize } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

// Enhanced AI responses for the data quality chatbot
const getAIResponse = async (message: string): Promise<string> => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const lowerMessage = message.toLowerCase();
  
  // Advanced feature responses
  if (lowerMessage.includes('profiling') || lowerMessage.includes('statistics')) {
    return "Data profiling provides statistical summaries of your data including value distributions, patterns, and anomalies. You can profile your datasets to understand data types, uniqueness, completeness, and value frequencies. This helps identify quality issues before they impact analysis.";
  } else if (lowerMessage.includes('lineage') || lowerMessage.includes('tracking')) {
    return "Data lineage tracks how data flows through your systems, showing its origin, transformations, and destinations. This helps with compliance, troubleshooting quality issues, and understanding data dependencies. We're currently developing this feature for the next release.";
  } else if (lowerMessage.includes('custom') && (lowerMessage.includes('rule') || lowerMessage.includes('validation'))) {
    return "Our custom validation rule builder lets you define complex data quality checks using a simple interface. You can create rules based on your business logic, set severity levels, and schedule automated checks. Would you like to see some examples of custom validation rules?";
  } else if (lowerMessage.includes('schedule') || lowerMessage.includes('automate')) {
    return "Scheduled validation jobs automate regular data quality checks. You can configure checks to run daily, weekly, or monthly, and receive alerts when issues are found. This ensures continuous data quality monitoring without manual intervention.";
  } else if (lowerMessage.includes('export') || lowerMessage.includes('pdf') || lowerMessage.includes('excel')) {
    return "You can export data quality reports in various formats including PDF, Excel, and CSV. These reports provide comprehensive summaries of validation results, comparisons, and trends over time. They can be automatically delivered to stakeholders via email.";
  } else if (lowerMessage.includes('catalog') || lowerMessage.includes('integration')) {
    return "Our platform can integrate with data catalogs like Collibra, Alation, and Atlan. This allows you to enrich your catalog metadata with data quality metrics and make quality scores discoverable across your organization.";
  } else if (lowerMessage.includes('anomaly') || lowerMessage.includes('ml') || lowerMessage.includes('machine learning')) {
    return "Our anomaly detection feature uses machine learning to identify unusual patterns in your data. Unlike rule-based validation, ML models can detect subtle anomalies by learning from historical data patterns. This is particularly useful for time-series data and complex datasets.";
  }
  
  // Handle different types of data quality related questions
  else if (lowerMessage.includes('validation') || lowerMessage.includes('check')) {
    return "Validation checks data quality against defined rules. Common checks include row counts, null values, data type validation, and custom business rules. To run a validation, go to the Validation page and select your dataset.";
  } else if (lowerMessage.includes('comparison') || lowerMessage.includes('compare')) {
    return "Data comparison helps identify differences between two datasets. You can compare schemas, column values, and identify missing records. Use the Comparison page to select source and target datasets to analyze differences. The comparison will show you matched rows, different values, and missing entries in either dataset.";
  } else if (lowerMessage.includes('report') || lowerMessage.includes('dashboard')) {
    return "Reports provide insights on data quality over time. The dashboard shows validation status across datasets and highlights quality trends. You can access detailed reports from the Reports page and export them in various formats for sharing with stakeholders.";
  } else if (lowerMessage.includes('missing') || lowerMessage.includes('null')) {
    return "Missing values can be detected through validation checks. Advanced validation can identify columns with high null rates, which may indicate data quality issues. Consider using custom SQL checks for complex null value patterns or our profiling tools to get comprehensive statistics on data completeness.";
  } else if (lowerMessage.includes('error') || lowerMessage.includes('issue')) {
    return "Common data quality issues include missing values, inconsistent formats, duplicate records, and referential integrity problems. Our validation tools can help identify these issues automatically and suggest possible remediation strategies.";
  } else if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return "Hello! I'm your data quality assistant. I can help with validation, comparison, profiling, lineage tracking, and more. How can I assist with your data quality needs today?";
  } else if (lowerMessage.includes('yes')) {
    return "Great! I can help with various data quality topics. Some of our popular features include data profiling, comparison, validation, lineage tracking, and anomaly detection. Which area would you like to explore further?";
  } else {
    return "I'm your data quality assistant. I can help with questions about data validation, comparison, profiling, lineage tracking, custom rules, and anomaly detection. What specific data quality challenges are you facing today?";
  }
};

const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your data quality assistant. How can I help you today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Get AI response
      const response = await getAIResponse(inputValue);
      
      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 shadow-lg w-80 sm:w-96 transition-all ${isMinimized ? 'h-14' : 'h-[500px] max-h-[80vh]'}`}>
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md flex items-center">
          <Bot className="h-5 w-5 mr-2 text-blue-600" />
          Data Quality Assistant
        </CardTitle>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMinimize}>
            {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleChatbot}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <>
          <CardContent className="p-0 h-[calc(100%-110px)]">
            <ScrollArea className="h-full pt-4 px-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center mr-2 flex-shrink-0 ${message.sender === 'user' ? 'ml-2 bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div
                      className={`py-2 px-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white dark:bg-blue-700'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-[10px] mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-3 pt-2 border-t">
            <form onSubmit={handleSubmit} className="flex w-full space-x-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask about data quality..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default AIChatbot;
