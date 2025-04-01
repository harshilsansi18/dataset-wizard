import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, Minimize, Maximize, Database, FileText, Upload, Loader, List, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  getDatasets, 
  getDatasetById, 
  DatasetType, 
  runValidation, 
  uploadDataset 
} from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
    // This will return a message that we should select a dataset
    // We'll handle dataset selection in the component itself
    return "SELECT_DATASET_FOR_VALIDATION";
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
  return "I can help you validate datasets or analyze data quality. Try saying 'validate dataset', 'analyze data quality', 'download reports', or 'upload dataset'.";
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
      content: "Hi! I'm your data validation assistant. I can help you analyze data quality, run validations, and upload datasets. Try commands like 'validate dataset', 'analyze data', 'upload dataset', or 'download reports'.",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [validationIntent, setValidationIntent] = useState<'analyze' | 'validate' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableDatasets, setAvailableDatasets] = useState<DatasetType[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    
    try {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: `Uploading ${file.name}...`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      const uploadedDataset = await uploadDataset(file);
      
      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Successfully uploaded ${file.name}. The dataset has ${uploadedDataset.rowCount} rows and ${uploadedDataset.columnCount} columns. You can now analyze it or run validations on it.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id ? successMessage : msg
      ));
      
      // Refresh the datasets list
      await fetchDatasets();
    } catch (error) {
      console.error('Error uploading file:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Failed to upload ${file.name}. Please try again or use a different file format (CSV or JSON are supported).`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUploading(false);
      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowUpload(false);
    }
  };

  const handleDatasetSelection = async (datasetId: string) => {
    setShowDatasetSelector(false);
    setSelectedDatasetId(null);
    
    const dataset = availableDatasets.find(ds => ds.id === datasetId);
    if (!dataset) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't find that dataset. Please select another one.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (validationIntent === 'analyze') {
        // Analyze the dataset
        const analysis = generateDatasetAnalysis(dataset);
        
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: analysis,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } 
      else if (validationIntent === 'validate') {
        // Run validation
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: `I'll run a validation on "${dataset.name}". Taking you to the validation page...`,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Navigate to validation page with the selected dataset
        setTimeout(() => {
          navigate('/validation');
          // Pass the selected dataset ID through sessionStorage
          sessionStorage.setItem('selectedDatasetId', datasetId);
        }, 800);
      }
    } catch (error) {
      console.error('Error processing dataset:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, there was an error processing your request. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setValidationIntent(null);
    }
  };

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
      console.log("Processing user message:", inputValue);
      await fetchDatasets();
      
      const lowerMessage = inputValue.toLowerCase();
      
      // Handle upload request
      if (lowerMessage.includes('upload') && (lowerMessage.includes('dataset') || lowerMessage.includes('file') || lowerMessage.includes('data'))) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Please select a file to upload (CSV or JSON format).",
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setShowUpload(true);
        
        // Focus may be needed after a short delay
        setTimeout(() => {
          if (fileInputRef.current) {
            fileInputRef.current.click();
          }
        }, 300);
      }
      // Handle validation or analysis requests
      else if (lowerMessage.includes('validate') || lowerMessage.includes('analyze') || lowerMessage.includes('check')) {
        // First check if we have datasets
        if (availableDatasets.length === 0) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "You don't have any datasets available. Would you like to upload one now?",
            sender: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        
        // Set validation intent based on message
        const intent = lowerMessage.includes('validate') ? 'validate' : 'analyze';
        setValidationIntent(intent);
        
        // Prompt user to select a dataset
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Please select which dataset you would like to ${intent}:`,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setShowDatasetSelector(true);
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
        
        // Add small delay before navigating to reports page
        setTimeout(() => {
          navigate('/reports');
        }, 800);
      }
      // Handle local storage explanation
      else if (lowerMessage.includes('storage') || (lowerMessage.includes('share') && lowerMessage.includes('data'))) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "This application stores datasets and connection information in your browser's localStorage. This means:\n\n1. Your datasets are stored only in your browser\n2. When you share the deployed URL, others will NOT see your datasets\n3. Each user has their own private storage in their browser\n4. To share datasets with others, you would need to export and send them the files directly",
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
      else {
        // Handle regular analysis or other requests
        const response = await getDataValidationResponse(inputValue, messages, availableDatasets);
        console.log("Got AI response:", response.substring(0, 50) + "...");
        
        if (response === "SELECT_DATASET_FOR_VALIDATION") {
          // Prompt user to select a dataset
          const intent = lowerMessage.includes('validate') ? 'validate' : 'analyze';
          setValidationIntent(intent);
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Please select which dataset you would like to ${intent}:`,
            sender: 'assistant',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setShowDatasetSelector(true);
        } else {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: response,
            sender: 'assistant',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
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
    <>
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
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                
                {showUpload && (
                  <Button
                    type="button"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about data validation..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading || uploading}
                  className="flex-1"
                  autoComplete="off"
                  tabIndex={0}
                  aria-label="Chat input"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || uploading || !inputValue.trim()}
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
      
      {/* Dataset Selector Dialog */}
      <Dialog 
        open={showDatasetSelector} 
        onOpenChange={(open) => {
          if (!open) {
            setShowDatasetSelector(false);
            setValidationIntent(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Dataset</DialogTitle>
            <DialogDescription>
              Choose which dataset you want to {validationIntent === 'analyze' ? 'analyze' : 'validate'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto">
            {availableDatasets.map((dataset) => (
              <Button
                key={dataset.id}
                variant="outline"
                className="w-full mb-2 justify-start text-left flex items-center"
                onClick={() => handleDatasetSelection(dataset.id)}
              >
                <Database className="h-4 w-4 mr-2 text-blue-500" />
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate">{dataset.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {dataset.type} • {dataset.rowCount} rows • {dataset.columnCount} columns
                  </p>
                </div>
                {selectedDatasetId === dataset.id && (
                  <Check className="h-4 w-4 ml-2 text-green-500" />
                )}
              </Button>
            ))}
            
            {availableDatasets.length === 0 && (
              <div className="text-center py-6">
                <p>No datasets available.</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setShowDatasetSelector(false);
                    setShowUpload(true);
                    setTimeout(() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }, 300);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload a dataset
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIChatbot;
