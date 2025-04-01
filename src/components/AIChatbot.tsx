
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, Minimize, Maximize, Database, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getDatasets, getDatasetById, DatasetType, runValidation } from '@/services/api';
import { useNavigate } from 'react-router-dom';

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
  
  // Command to download report
  if (lowerMessage.includes('download') && lowerMessage.includes('report')) {
    return "To download a validation report, please navigate to the Reports page where you can select datasets and export reports as CSV files.";
  }
  
  // Command for specific validation
  if (lowerMessage.includes('run validation') || lowerMessage.includes('validate')) {
    let specificDataset = null;
    
    // Try to identify a specific dataset by name
    for (const dataset of availableDatasets) {
      if (lowerMessage.includes(dataset.name.toLowerCase())) {
        specificDataset = dataset;
        break;
      }
    }
    
    if (!specificDataset) {
      specificDataset = availableDatasets[0];
    }
    
    const method = lowerMessage.includes('advanced') ? 'advanced' : 'basic';
    
    return `I'll run a ${method} validation on "${specificDataset.name}". Please go to the Validation page to see the results. You can then review them in the Reports section.`;
  }
  
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
  
  // Default response if nothing else matched
  return "I can help you validate datasets or analyze data quality. Try asking me to 'analyze my dataset', 'run validation', or 'download reports'.";
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
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your data validation assistant. Ask me to analyze datasets, run validations, or download reports.",
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
  const [availableDatasets, setAvailableDatasets] = useState<DatasetType[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  useEffect(() => {
    console.log("Chatbot state: open=", isOpen, "minimized=", isMinimized);
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      console.log("Fetching datasets for chatbot...");
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
    if (isOpen && !isMinimized) {
      const focusTimer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log("Input focused");
        }
      }, 300);
      
      return () => clearTimeout(focusTimer);
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
    
    try {
      console.log("Reloading datasets before analysis...");
      await fetchDatasets();
      
      const lowerMessage = inputValue.toLowerCase();
      
      // Handle direct validation requests
      if (lowerMessage.includes('run validation') || lowerMessage.includes('validate')) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'll run a validation for you. Taking you to the validation page...",
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Add small delay before navigating to validation page
        setTimeout(() => {
          navigate('/validation');
        }, 800);
      }
      // Handle download report requests
      else if (lowerMessage.includes('download') && lowerMessage.includes('report')) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "You can download validation reports from the Reports page. Taking you there...",
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
      else {
        // Handle regular analysis or other requests
        const response = await getDataValidationResponse(inputValue, messages, availableDatasets);
        console.log("Got AI response:", response.substring(0, 50) + "...");
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
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
    console.log("Toggling chatbot:", !isOpen);
    setIsOpen(prev => !prev);
    setIsMinimized(false);
    if (!isOpen) {
      fetchDatasets();
    }
  };

  const toggleMinimize = () => {
    console.log("Toggling minimize:", !isMinimized);
    setIsMinimized(prev => !prev);
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
          
          <CardFooter className="p-3 pt-2 border-t">
            <form onSubmit={handleSubmit} className="flex w-full space-x-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask about data validation..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1"
                autoComplete="off"
                tabIndex={0}
                aria-label="Chat input"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
                tabIndex={0}
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
