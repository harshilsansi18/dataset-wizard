
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";  // Corrected capitalization
import { useDatasets } from '@/contexts/DatasetsContext';
// Let's make sure to import uploadDataset from the API
import { uploadDataset, runValidation } from '@/services/api';

interface Message {
  id: string;
  role: "user" | "assistant";  // Limited to these two strings only
  content: string;
  timestamp: string;
}

const AIChatbotEnhanced: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastUploadedDatasetId, setLastUploadedDatasetId] = useState<string | null>(null);
  const { refreshDatasets } = useDatasets();
  const { toast } = useToast();

  const addMessage = useCallback((message: Message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInput("");
    setIsThinking(true);

    // Simulate a delayed response from the assistant
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `This is a simulated response to: "${input}". You said: ${input}`,
        timestamp: new Date().toISOString(),
      };

      addMessage(assistantMessage);
      setIsThinking(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Call the new function to handle dataset upload
    await handleChatbotDatasetUpload(file);

    // Clear the file input
    e.target.value = '';
  };

  // Inside the component function, correctly handle file upload
  const handleChatbotDatasetUpload = async (file: File) => {
    try {
      const dataset = await uploadDataset(file);
      toast({
        title: "Dataset uploaded successfully",
        description: `${dataset.name} has been added to your datasets.`,
      });
      refreshDatasets();

      // Add a message to the chat about the successful upload
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `I've successfully uploaded the dataset "${dataset.name}". Would you like me to run a validation on it?`,
        timestamp: new Date().toISOString(),
      };

      // Add the message to the conversation
      addMessage(newMessage);

      // Store the dataset ID for potential validation
      setLastUploadedDatasetId(dataset.id);

      return dataset.id;
    } catch (error) {
      console.error("Error uploading dataset:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your dataset. Please try again.",
        variant: "destructive",
      });

      // Add an error message to the chat
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "I couldn't upload your dataset. Please check the file format and try again.",
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);

      return null;
    }
  };

  const handleRunValidation = async () => {
    if (!lastUploadedDatasetId) {
      toast({
        title: "No Dataset Uploaded",
        description: "Please upload a dataset first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Run validation on the last uploaded dataset
      const validationResult = await runValidation(lastUploadedDatasetId);

      toast({
        title: "Validation Started",
        description: `Validation has been initiated for dataset ID: ${lastUploadedDatasetId}.`,
      });

      // Add a message to the chat about the validation
      const validationMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `I've started the validation process for the dataset. I'll let you know when it's done.`,
        timestamp: new Date().toISOString(),
      };
      addMessage(validationMessage);

    } catch (error) {
      console.error("Error running validation:", error);
      toast({
        title: "Validation Failed",
        description: "There was an error running the validation. Please try again.",
        variant: "destructive",
      });

      // Add an error message to the chat
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "I couldn't start the validation process. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <h3 className="text-lg font-semibold">AI Chatbot</h3>
        <p className="text-sm text-muted-foreground">
          Interact with the AI to manage your datasets.
        </p>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-4 p-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <Avatar className="mr-3">
                    <AvatarImage src="https://github.com/shadcn.png" alt="AI Avatar" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg p-2 text-sm w-fit max-w-[60%] ${message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
                  {message.content}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex items-start justify-start">
                <Avatar className="mr-3">
                  <AvatarImage src="https://github.com/shadcn.png" alt="AI Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-2 text-sm w-fit max-w-[60%] bg-muted">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="w-full flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSendMessage}>Send</Button>
          <Input
            type="file"
            id="upload-dataset"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" asChild>
            <label htmlFor="upload-dataset" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              <span>Upload Dataset</span>
            </label>
          </Button>
          <Button onClick={handleRunValidation}>Run Validation</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIChatbotEnhanced;
