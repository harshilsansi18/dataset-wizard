
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, Minimize, Maximize, Sparkles, Database, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getDatasets, getDatasetById, DatasetType } from '@/services/api';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

type ValidationSuggestion = {
  column: string;
  issue: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
};

const getDataValidationResponse = async (
  message: string, 
  messageHistory: Message[],
  availableDatasets?: DatasetType[]
): Promise<string> => {
  console.log("Processing chatbot message with datasets:", availableDatasets?.length);
  
  if (!availableDatasets || availableDatasets.length === 0) {
    return "I don't see any datasets available. Please upload a dataset first or connect to your database to import tables.";
  }
  
  const lowerMessage = message.toLowerCase();
  
  const isValidationQuery = lowerMessage.includes('valid') || 
                            lowerMessage.includes('check') || 
                            lowerMessage.includes('quality') || 
                            lowerMessage.includes('issue') || 
                            lowerMessage.includes('error') || 
                            lowerMessage.includes('problem') ||
                            lowerMessage.includes('analyze');
  
  const datasetMentioned = availableDatasets?.find(ds => 
    lowerMessage.includes(ds.name.toLowerCase())
  );
  
  if (isValidationQuery) {
    // Select the mentioned dataset or the first one if none mentioned
    const datasetToAnalyze = datasetMentioned || availableDatasets[0];
    console.log("Analyzing dataset:", datasetToAnalyze.name);
    return generateDatasetAnalysis(datasetToAnalyze);
  }
  
  if (lowerMessage.includes('list') && (lowerMessage.includes('dataset') || lowerMessage.includes('data'))) {
    if (availableDatasets && availableDatasets.length > 0) {
      return `Here are your available datasets:\n\n${availableDatasets.map((ds, index) => 
        `${index + 1}. ${ds.name} (${ds.type}) - ${ds.rowCount} rows, ${ds.columnCount} columns, Status: ${ds.status || 'Not Validated'}`
      ).join('\n')}`;
    } else {
      return "You don't have any datasets available yet. You can upload one from the Datasets page.";
    }
  }
  
  if (lowerMessage.includes('fix') || lowerMessage.includes('repair') || lowerMessage.includes('clean')) {
    return "To fix data quality issues, I recommend:\n\n1. **Missing values**: Consider imputation techniques appropriate for your data type (mean/median for numeric, mode for categorical).\n\n2. **Type inconsistencies**: Transform values to maintain consistency, e.g., standardize date formats or number representations.\n\n3. **Outliers**: Decide whether to remove, cap, or transform outliers based on your analysis needs.\n\n4. **Duplicates**: Remove duplicate records or make them unique by adding identifiers.\n\nWould you like specific guidance on a particular dataset?";
  }
  
  const hasContextAbout = (topic: string): boolean => {
    return messageHistory.some(msg => 
      msg.sender === 'user' && 
      msg.content.toLowerCase().includes(topic.toLowerCase())
    );
  };

  if (lowerMessage.includes('rule') || lowerMessage.includes('check') || lowerMessage.includes('criteria')) {
    return "I can help you create data validation rules including:\n\n- **Completeness checks**: Ensure required fields are populated\n- **Format validation**: Verify dates, emails, phone numbers follow correct patterns\n- **Range checks**: Confirm numeric values are within acceptable ranges\n- **Cross-field validation**: Ensure logical relationships between fields\n- **Uniqueness checks**: Identify duplicate records\n\nI can implement these rules as part of the validation process. Which type of validation rule interests you?";
  }
  
  if (lowerMessage.includes('best practice') || lowerMessage.includes('recommend') || lowerMessage.includes('advice')) {
    return "Here are data quality best practices:\n\n1. **Validate at collection**: Prevent errors early with input validation\n2. **Document assumptions**: Create a data dictionary with expected formats and constraints\n3. **Profile regularly**: Continuously monitor data quality metrics\n4. **Create tests**: Develop automated quality checks for important datasets\n5. **Standardize cleanup**: Establish consistent procedures for handling common issues\n\nConsistent validation will save time and increase confidence in your analysis results.";
  }
  
  // Default response if nothing else matched
  return "I can analyze your datasets for quality issues. Just let me know which dataset you'd like me to check, or I can analyze the first available one.";
};

const generateDatasetAnalysis = (dataset: DatasetType): string => {
  console.log("Generating analysis for dataset:", dataset.name);
  
  if (!dataset.content || !dataset.headers) {
    return `I'd like to analyze "${dataset.name}" but I can't access its content. Please ensure the dataset is properly loaded.`;
  }
  
  const suggestions: ValidationSuggestion[] = [];
  const summary: string[] = [];
  let totalNullCount = 0;
  let columnsWithIssues = 0;
  
  summary.push(`## Analysis for "${dataset.name}"`);
  summary.push(`**Type**: ${dataset.type}`);
  summary.push(`**Size**: ${dataset.rowCount} rows, ${dataset.columnCount} columns`);
  
  dataset.headers.forEach(column => {
    const nullCount = dataset.content!.filter(row => !row[column] && row[column] !== 0 && row[column] !== false).length;
    if (nullCount > 0) {
      totalNullCount += nullCount;
      columnsWithIssues++;
      
      const severity = nullCount / dataset.content!.length > 0.2 ? 'high' : 
                      nullCount / dataset.content!.length > 0.05 ? 'medium' : 'low';
      
      suggestions.push({
        column,
        issue: `Missing values (${nullCount} rows, ${Math.round(nullCount/dataset.content!.length*100)}%)`,
        suggestion: severity === 'high' ? 
          "Consider imputing missing values or removing the column if too sparse." : 
          "Consider replacing missing values with appropriate defaults.",
        severity
      });
    }
    
    const uniqueTypes = new Set();
    let isDate = true;
    let isNumeric = true;
    
    const sampleRows = dataset.content!.slice(0, 100);
    for (const row of sampleRows) {
      const value = row[column];
      if (value === null || value === undefined || value === '') continue;
      
      if (!isNaN(Number(value))) {
        uniqueTypes.add('number');
      } 
      else if (!isNaN(Date.parse(value))) {
        uniqueTypes.add('date');
      } 
      else {
        uniqueTypes.add('string');
        isDate = false;
        isNumeric = false;
      }
    }
    
    if (uniqueTypes.size > 1) {
      columnsWithIssues++;
      suggestions.push({
        column,
        issue: "Inconsistent data types",
        suggestion: "Standardize values to maintain a consistent type throughout the column.",
        severity: 'medium'
      });
    }
  });
  
  const dataQuality = columnsWithIssues / dataset.headers.length;
  let qualityRating: string;
  
  if (dataQuality > 0.3) {
    qualityRating = "Poor";
    summary.push(`I've found significant quality issues that need attention.`);
  } else if (dataQuality > 0.1) {
    qualityRating = "Fair";
    summary.push(`I've found some quality issues that should be addressed.`);
  } else if (columnsWithIssues > 0) {
    qualityRating = "Good";
    summary.push(`I've found minor quality issues that could be improved.`);
  } else {
    qualityRating = "Excellent";
    summary.push(`This dataset appears to have excellent data quality with no obvious issues.`);
  }
  
  summary.push(`**Data Quality Rating**: ${qualityRating}`);
  if (totalNullCount > 0) {
    summary.push(`**Missing Values**: ${totalNullCount} values missing across ${columnsWithIssues} columns`);
  }
  
  let response = summary.join('\n\n');
  
  if (suggestions.length > 0) {
    response += '\n\n**Detailed Issues**:\n';
    
    const highSeverity = suggestions.filter(s => s.severity === 'high');
    const mediumSeverity = suggestions.filter(s => s.severity === 'medium');
    const lowSeverity = suggestions.filter(s => s.severity === 'low');
    
    if (highSeverity.length > 0) {
      response += '\n❌ **Critical Issues**:\n';
      highSeverity.forEach(s => {
        response += `- **${s.column}**: ${s.issue}\n  → ${s.suggestion}\n`;
      });
    }
    
    if (mediumSeverity.length > 0) {
      response += '\n⚠️ **Warnings**:\n';
      mediumSeverity.forEach(s => {
        response += `- **${s.column}**: ${s.issue}\n  → ${s.suggestion}\n`;
      });
    }
    
    if (lowSeverity.length > 0) {
      response += '\n📝 **Minor Issues**:\n';
      lowSeverity.forEach(s => {
        response += `- **${s.column}**: ${s.issue}\n  → ${s.suggestion}\n`;
      });
    }
  }
  
  response += '\n\n**Next Steps**:\n';
  if (suggestions.length > 0) {
    response += '1. Address the issues above, starting with critical ones\n';
    response += '2. Run validation again after making changes\n';
    response += '3. Consider setting up automated validation rules\n';
  } else {
    response += '1. Your data looks good! Consider setting up validation rules to maintain quality\n';
    response += '2. You can proceed confidently with your analysis\n';
  }
  
  return response;
};

const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your data validation assistant. How can I help analyze and improve your datasets today?",
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
    "Analyze my dataset for quality issues",
    "What data validation rules should I use?",
    "How can I fix missing values?",
    "Check my CSV file for errors"
  ]);
  const [availableDatasets, setAvailableDatasets] = useState<DatasetType[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      fetchDatasets();
    }
  }, [isOpen, isMinimized]);

  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const datasets = await getDatasets();
      console.log("Chatbot loaded datasets:", datasets.length);
      setAvailableDatasets(datasets);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoadingDatasets(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
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
      // Force reload datasets before analysis
      await fetchDatasets();
      
      const response = await getDataValidationResponse(inputValue, messages, availableDatasets);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
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
    
    const newSuggestions: string[] = [];
    
    if (lowerUserInput.includes('valid') || lowerUserInput.includes('check') || lowerAiResponse.includes('quality')) {
      newSuggestions.push("What validation rules should I set up?");
      newSuggestions.push("How do I fix these quality issues?");
    }
    
    if (lowerUserInput.includes('miss') || lowerUserInput.includes('missing')) {
      newSuggestions.push("What's the best way to handle missing values?");
      newSuggestions.push("Should I remove or impute missing data?");
    }
    
    if (lowerUserInput.includes('type') || lowerAiResponse.includes('type')) {
      newSuggestions.push("How do I fix inconsistent data types?");
      newSuggestions.push("Can you help me standardize date formats?");
    }
    
    if (availableDatasets.length > 0) {
      const randomDataset = availableDatasets[Math.floor(Math.random() * availableDatasets.length)];
      newSuggestions.push(`Analyze the quality of ${randomDataset.name}`);
    }
    
    if (newSuggestions.length < 2) {
      newSuggestions.push("What are best practices for data quality?");
      newSuggestions.push("List my datasets");
      newSuggestions.push("How do I validate a numerical column?");
    }
    
    while (newSuggestions.length > 4) {
      const randomIndex = Math.floor(Math.random() * newSuggestions.length);
      newSuggestions.splice(randomIndex, 1);
    }
    
    setSuggestions(newSuggestions);
  };

  const toggleChatbot = () => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
    if (!isOpen) {
      fetchDatasets();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setIsSuggesting(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderMessage = (message: Message) => {
    if (message.sender === 'assistant') {
      const parts = [];
      let currentText = '';
      let inBold = false;
      
      for (let i = 0; i < message.content.length; i++) {
        if (message.content.substring(i, i + 2) === '**') {
          if (currentText) {
            parts.push({ type: inBold ? 'bold' : 'text', content: currentText });
            currentText = '';
          }
          inBold = !inBold;
          i++;
        } else if (message.content.substring(i, i + 1) === '\n') {
          if (currentText) {
            parts.push({ type: inBold ? 'bold' : 'text', content: currentText });
            currentText = '';
          }
          parts.push({ type: 'break' });
        } else {
          currentText += message.content[i];
        }
      }
      
      if (currentText) {
        parts.push({ type: inBold ? 'bold' : 'text', content: currentText });
      }
      
      return (
        <div className="text-sm">
          {parts.map((part, index) => {
            if (part.type === 'bold') {
              return <span key={index} className="font-semibold">{part.content}</span>;
            } else if (part.type === 'break') {
              return <br key={index} />;
            } else {
              return <span key={index}>{part.content}</span>;
            }
          })}
        </div>
      );
    }
    
    return <p className="text-sm">{message.content}</p>;
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
        size="icon"
      >
        <FileText className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 shadow-lg w-80 sm:w-96 transition-all ${isMinimized ? 'h-14' : 'h-[500px] max-h-[80vh]'} z-50`}>
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Data Validation Assistant
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
                        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div
                      className={`py-2 px-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white dark:bg-blue-700'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                      }`}
                    >
                      {renderMessage(message)}
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
                placeholder="Ask about data validation..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsSuggesting(true)}
                disabled={isLoading}
                className="flex-1"
                autoComplete="off"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default AIChatbot;
