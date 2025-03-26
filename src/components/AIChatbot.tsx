
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, Minimize, Maximize, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

// Enhanced AI responses for the data quality chatbot
const getAIResponse = async (message: string, messageHistory: Message[]): Promise<string> => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const lowerMessage = message.toLowerCase();
  
  // Check context from previous messages for more relevant responses
  const hasContextAbout = (topic: string): boolean => {
    return messageHistory.some(msg => 
      msg.sender === 'user' && 
      msg.content.toLowerCase().includes(topic.toLowerCase())
    );
  };

  // Enhanced data profiling responses
  if (lowerMessage.includes('profil') || lowerMessage.includes('statistics') || lowerMessage.includes('stats')) {
    if (hasContextAbout('column') || lowerMessage.includes('column')) {
      return "Our column-level profiling provides detailed statistics including min/max values, quantiles, unique values count, most common values, and pattern detection. This helps identify outliers, inconsistencies, and potential quality issues at the column level. Would you like to see a sample profile for a specific column type?";
    }
    
    return "Data profiling provides comprehensive statistical summaries of your dataset including: value distributions, patterns, anomalies, completeness metrics, and data type inference. Our profiling engine can handle large datasets efficiently and produces interactive dashboards with drill-down capabilities. The profiles help identify quality issues like outliers, format inconsistencies, and data gaps before they impact analysis.";
  } 
  
  // Data lineage tracking
  else if (lowerMessage.includes('lineage') || lowerMessage.includes('tracking') || lowerMessage.includes('history')) {
    return "Our data lineage tracking visualizes how data flows through your systems from source to destination. It captures transformations, dependencies, and quality checks at each stage. This helps with regulatory compliance (GDPR, CCPA), impact analysis when schemas change, and pinpointing where quality issues originate. The interactive lineage graph makes it easy to follow your data journey with full audit capabilities.";
  } 
  
  // Custom validation rules
  else if ((lowerMessage.includes('custom') || lowerMessage.includes('create') || lowerMessage.includes('build')) && 
           (lowerMessage.includes('rule') || lowerMessage.includes('validation') || lowerMessage.includes('check'))) {
    if (lowerMessage.includes('complex') || lowerMessage.includes('advanced')) {
      return "For complex validation rules, you can combine multiple conditions using AND/OR logic, reference other columns, and use functions like REGEX_MATCH, IS_DATE, IS_NUMBER. Example: WHEN column_A > 100 AND column_B MATCHES '[A-Z]{2}\\d{4}' THEN FAIL WITH 'Invalid format detected'. You can also schedule these rules to run automatically and send alerts when they fail.";
    }
    return "Our rule builder lets you create powerful validation checks without writing code. You can define thresholds for completeness, uniqueness, referential integrity, and value patterns. Rules can be categorized by severity (Critical, Warning, Info) and organized into reusable test suites. The visual rule builder shows sample data as you build, making it easy to test rules on real data.";
  } 
  
  // Scheduled validation
  else if (lowerMessage.includes('schedule') || lowerMessage.includes('automate') || lowerMessage.includes('automatic')) {
    return "Scheduled validation jobs automate regular data quality checks based on your defined intervals (hourly, daily, weekly). You can configure different validation suites for different datasets and receive alerts via email, Slack, or other notification channels when issues are detected. The scheduling system supports dependencies between jobs and provides detailed execution logs and performance metrics.";
  } 
  
  // Export capabilities
  else if (lowerMessage.includes('export') || lowerMessage.includes('pdf') || lowerMessage.includes('excel') || lowerMessage.includes('report')) {
    return "Our export capabilities include customizable reports in multiple formats: PDF for executive summaries, Excel for detailed analysis, and CSV for raw data. Reports can include trend charts showing quality metrics over time, detailed validation results, and recommendations for improvement. You can also schedule automated reports to be delivered to stakeholders regularly with custom branding options.";
  } 
  
  // Data catalog integration
  else if (lowerMessage.includes('catalog') || lowerMessage.includes('integration') || lowerMessage.includes('connect')) {
    return "We integrate seamlessly with popular data catalogs like Collibra, Alation, Atlan, and Datahub. This integration enriches your catalog with quality metrics, validation status, and lineage information. The bidirectional synchronization ensures your data governance tools always have the latest quality insights, making quality scores discoverable across your organization. Would you like more information on a specific catalog integration?";
  } 
  
  // Anomaly detection
  else if (lowerMessage.includes('anomaly') || lowerMessage.includes('ml') || lowerMessage.includes('machine learning') || lowerMessage.includes('detect')) {
    return "Our anomaly detection uses machine learning to identify unusual patterns in your data that traditional rule-based validation might miss. The system learns normal patterns from historical data and flags deviations automatically. This is particularly powerful for time-series data, complex relationships between columns, and detecting subtle data drift. The ML models continuously improve as they process more data, adapting to seasonal patterns and legitimate changes in your data.";
  }
  
  // Database connection questions
  else if (lowerMessage.includes('database') || lowerMessage.includes('postgres') || lowerMessage.includes('mysql') || lowerMessage.includes('sql')) {
    if (lowerMessage.includes('connect') || lowerMessage.includes('integration')) {
      return "Our database connection feature allows you to link directly to PostgreSQL, MySQL, Oracle, SQL Server, and other databases. The connection is encrypted and secure, and supports both direct queries and metadata extraction. Once connected, you can validate data, run comparisons, and set up monitoring just like with uploaded datasets. For large databases, we use efficient sampling techniques to provide quick insights without performance impacts.";
    }
    
    return "The platform supports various database systems including PostgreSQL, MySQL, Oracle, and SQL Server. You can connect using standard connection parameters (host, port, database name, username, password) with optional SSL encryption. Once connected, all schema objects become available for validation and comparison workflows. Our smart caching system minimizes database load while keeping quality metrics current.";
  }
  
  // Specific validation question handling
  else if (lowerMessage.includes('validation') || lowerMessage.includes('check') || lowerMessage.includes('quality')) {
    if (lowerMessage.includes('best') || lowerMessage.includes('practice')) {
      return "Best practices for data validation include: 1) Start with column-level checks for completeness, type consistency, and range validation, 2) Add row-level checks that validate relationships between columns, 3) Implement cross-dataset validation for referential integrity, 4) Establish quality thresholds appropriate to your domain, and 5) Automate validation to catch issues early. Would you like specific examples for your data type?";
    }
    
    if (lowerMessage.includes('fail') || lowerMessage.includes('error') || lowerMessage.includes('issue')) {
      return "Common validation failures include: inconsistent data types, null values in required fields, duplicate primary keys, reference violations, pattern mismatches, and outliers outside acceptable ranges. Our platform helps you identify root causes through detailed error messages, sample data that failed checks, and trend analysis to determine if issues are isolated or systematic. I can help create specific validation rules to catch these issues if you describe your dataset.";
    }
    
    return "Our validation engine supports three tiers of checks: 1) Basic checks for row counts, null values, and data types, 2) Advanced checks for referential integrity, business rules, and schema validation, and 3) Custom SQL checks for complex validations. Each validation produces detailed results showing pass/fail status, affected rows, and recommended actions. Would you like help setting up a specific type of validation?";
  } 
  
  // Comparison feature explanation
  else if (lowerMessage.includes('comparison') || lowerMessage.includes('compare') || lowerMessage.includes('diff')) {
    if (lowerMessage.includes('column') || lowerMessage.includes('schema')) {
      return "Our column comparison analyzes schema differences between datasets including: added/removed columns, data type changes, and statistical distribution shifts. The system highlights potential compatibility issues when column properties change and provides detailed metrics on how value distributions differ between datasets, even when the schema remains the same.";
    }
    
    return "Dataset comparison identifies differences between two datasets at multiple levels: schema changes, value differences, missing records, and statistical variations. The comparison engine efficiently handles large datasets through optimized algorithms and provides interactive visualizations of the differences. This is particularly useful for verifying ETL processes, comparing production vs. test data, and validating data migrations.";
  }
  
  // Debugging and troubleshooting help
  else if (lowerMessage.includes('debug') || lowerMessage.includes('troubleshoot') || lowerMessage.includes('help me fix')) {
    return "To troubleshoot data quality issues, I recommend: 1) Review the validation logs for specific error messages, 2) Examine sample records that failed validation, 3) Check for patterns in the failing data, 4) Verify if recent changes coincide with the issues, and 5) Run targeted validations to isolate the problem. I can help interpret error messages or suggest specific checks if you share more details about the issue you're experiencing.";
  }
  
  // Basic greeting response
  else if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return "Hello! I'm your advanced data quality assistant. I can help with validation, comparison, profiling, lineage tracking, custom rule creation, anomaly detection, and more. How can I assist with your data quality needs today?";
  } 
  
  // General affirmation
  else if (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('please')) {
    return "Great! To help you more effectively, could you tell me more about your specific data quality needs? For example, are you looking to validate a specific dataset, compare datasets, set up automated checks, or something else? The more details you provide, the better I can tailor my assistance.";
  } 
  
  // General data quality assistant response
  else {
    // Provide a varied response to avoid repetition
    const responses = [
      "I'm your data quality assistant with expertise in validation, profiling, lineage tracking, anomaly detection, and more. What specific data quality challenges are you facing today?",
      "As your data quality guide, I can help with everything from basic validations to machine learning-powered anomaly detection. What aspect of data quality would you like to explore?",
      "I'm here to help improve your data quality through validation, comparison, profiling, and advanced analytics. Could you share more details about your specific needs?",
      "I can assist with data validation strategies, quality monitoring, and implementing best practices for maintaining high-quality data. What would you like to know more about?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your advanced data quality assistant. How can I help you today?",
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
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How does data profiling work?",
    "Tell me about custom validation rules",
    "How can I detect anomalies in my data?",
    "What's data lineage tracking?"
  ]);

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
    setIsSuggesting(false);
    
    try {
      // Get AI response with message history for context
      const response = await getAIResponse(inputValue, messages);
      
      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update suggestions based on conversation context
      generateNewSuggestions(inputValue, response);
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

  const generateNewSuggestions = (userInput: string, aiResponse: string) => {
    const lowerUserInput = userInput.toLowerCase();
    const lowerAiResponse = aiResponse.toLowerCase();
    
    // Generate contextual suggestions based on the conversation
    const newSuggestions: string[] = [];
    
    if (lowerUserInput.includes('profil') || lowerAiResponse.includes('profil')) {
      newSuggestions.push("Show me a sample data profile");
      newSuggestions.push("How does column-level profiling work?");
    }
    
    if (lowerUserInput.includes('validat') || lowerAiResponse.includes('validat')) {
      newSuggestions.push("What are best practices for data validation?");
      newSuggestions.push("How do I create custom validation rules?");
    }
    
    if (lowerUserInput.includes('anomal') || lowerAiResponse.includes('anomal') || 
        lowerUserInput.includes('ml') || lowerAiResponse.includes('machine learning')) {
      newSuggestions.push("How accurate is anomaly detection?");
      newSuggestions.push("Can I see examples of detected anomalies?");
    }
    
    if (lowerUserInput.includes('lineage') || lowerAiResponse.includes('lineage')) {
      newSuggestions.push("How detailed is the lineage tracking?");
      newSuggestions.push("How does lineage help with compliance?");
    }
    
    // Add database specific suggestions
    if (lowerUserInput.includes('database') || lowerUserInput.includes('postgres') || 
        lowerAiResponse.includes('database') || lowerAiResponse.includes('postgres')) {
      newSuggestions.push("How secure are database connections?");
      newSuggestions.push("Can I validate data directly in the database?");
    }
    
    // Add some default suggestions if we couldn't generate contextual ones
    if (newSuggestions.length < 2) {
      newSuggestions.push("Tell me about data comparison features");
      newSuggestions.push("How can I schedule automated validations?");
      newSuggestions.push("What export formats are supported?");
    }
    
    // Limit to 4 suggestions and randomize if we have more
    while (newSuggestions.length > 4) {
      const randomIndex = Math.floor(Math.random() * newSuggestions.length);
      newSuggestions.splice(randomIndex, 1);
    }
    
    setSuggestions(newSuggestions);
  };

  const toggleChatbot = () => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setIsSuggesting(false);
    inputRef.current?.focus();
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
    <Card className={`fixed bottom-6 right-6 shadow-lg w-80 sm:w-96 transition-all ${isMinimized ? 'h-14' : 'h-[500px] max-h-[80vh]'} z-50`}>
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
          
          <CardFooter className="p-3 pt-2 border-t flex flex-col">
            {isSuggesting && suggestions.length > 0 && (
              <div className="w-full mb-2 flex flex-wrap gap-1">
                {suggestions.map((suggestion, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm" 
                    className="text-xs py-1 h-auto flex items-center"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex w-full space-x-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask about data quality..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsSuggesting(true)}
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
