
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  pageContext: string | null;
  setPageContext: (context: string | null) => void;
  addPageSpecificMessage: (message: string) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider = ({ children }: ChatbotProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pageContext, setPageContext] = useState<string | null>(null);

  const addPageSpecificMessage = (message: string) => {
    // This function will be used to add page-specific messages to the chatbot
    // For now, we'll just set the page context
    setPageContext(message);
    // You can extend this to directly send messages to the chatbot
  };

  return (
    <ChatbotContext.Provider 
      value={{ 
        isOpen, 
        setIsOpen, 
        pageContext, 
        setPageContext,
        addPageSpecificMessage
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};
