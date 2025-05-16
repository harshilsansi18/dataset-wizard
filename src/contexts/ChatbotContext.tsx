import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

// Define message type for better structure
export type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  suggestions?: string[];
  reportPreview?: any;
  isError?: boolean;
};

// Define user's saved chats structure
export type SavedChat = {
  id: string;
  title: string;
  timestamp: Date;
  previewMessage: string;
  messages: ChatMessage[];
};

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  pageContext: string | null;
  setPageContext: (context: string | null) => void;
  addPageSpecificMessage: (message: string) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  savedChats: SavedChat[];
  currentChatId: string | null;
  saveCurrentChat: (title?: string) => void;
  loadChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  isMuted: boolean;
  toggleMute: () => void;
  fontSize: "small" | "medium" | "large";
  setFontSize: (size: "small" | "medium" | "large") => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  content: "Hello! I'm your AI assistant. How can I help you today?",
  role: "assistant",
  timestamp: new Date(),
  suggestions: ["Show latest report", "Run data validation", "Help me understand data quality"]
};

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider = ({ children }: ChatbotProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pageContext, setPageContext] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  // Load saved chats from localStorage on mount
  useEffect(() => {
    const savedChatsJson = localStorage.getItem('chatbot_saved_chats');
    if (savedChatsJson) {
      try {
        const parsed = JSON.parse(savedChatsJson);
        // Convert string dates back to Date objects
        const parsedChats: SavedChat[] = parsed.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSavedChats(parsedChats);
      } catch (error) {
        console.error('Error parsing saved chats:', error);
      }
    }

    // Load mute preference
    const muteSetting = localStorage.getItem('chatbot_muted');
    if (muteSetting) {
      setIsMuted(muteSetting === 'true');
    }

    // Load font size preference
    const fontSizeSetting = localStorage.getItem('chatbot_font_size');
    if (fontSizeSetting && ['small', 'medium', 'large'].includes(fontSizeSetting)) {
      setFontSize(fontSizeSetting as "small" | "medium" | "large");
    }
  }, []);

  // Save chats to localStorage when they change
  useEffect(() => {
    if (savedChats.length > 0) {
      localStorage.setItem('chatbot_saved_chats', JSON.stringify(savedChats));
    }
  }, [savedChats]);

  // Save mute preference
  useEffect(() => {
    localStorage.setItem('chatbot_muted', String(isMuted));
  }, [isMuted]);

  // Save font size preference
  useEffect(() => {
    localStorage.setItem('chatbot_font_size', fontSize);
  }, [fontSize]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentChatId(null);
  }, []);

  const saveCurrentChat = useCallback((title?: string) => {
    if (messages.length <= 1) return; // Don't save empty chats
    
    // Create a chat title based on the first user message if not provided
    const userMessages = messages.filter(m => m.role === 'user');
    const defaultTitle = userMessages.length > 0 
      ? userMessages[0].content.slice(0, 30) + (userMessages[0].content.length > 30 ? '...' : '')
      : 'New Chat';
    
    const chatTitle = title || defaultTitle;
    
    // Create a new chat object
    const newChat: SavedChat = {
      id: currentChatId || `chat_${Date.now()}`,
      title: chatTitle,
      timestamp: new Date(),
      previewMessage: userMessages.length > 0 ? userMessages[0].content : 'Empty chat',
      messages: [...messages]
    };
    
    // Update saved chats
    setSavedChats(prev => {
      const existingIndex = prev.findIndex(chat => chat.id === newChat.id);
      if (existingIndex >= 0) {
        // Update existing chat
        const updated = [...prev];
        updated[existingIndex] = newChat;
        return updated;
      } else {
        // Add new chat
        return [newChat, ...prev];
      }
    });
    
    setCurrentChatId(newChat.id);
    
    return newChat.id;
  }, [messages, currentChatId]);

  const loadChat = useCallback((chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
    }
  }, [savedChats]);

  const deleteChat = useCallback((chatId: string) => {
    setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
    
    if (currentChatId === chatId) {
      clearMessages();
    }
  }, [currentChatId, clearMessages]);

  const addPageSpecificMessage = useCallback((message: string) => {
    // Set the page context
    setPageContext(message);
    
    // Add a context-specific message
    const contextMessage: ChatMessage = {
      id: `context_${Date.now()}`,
      content: `I see you're looking at ${message}. How can I assist you with this?`,
      role: "assistant",
      timestamp: new Date(),
      suggestions: ["Tell me more about this", `Help me understand ${message}`, "What should I look for?"]
    };
    
    setMessages(prev => {
      // If we only have the welcome message, replace it with context
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [contextMessage];
      }
      // Otherwise add to existing messages
      return [...prev, contextMessage];
    });
    
    // Open the chatbot with the new context if needed
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return (
    <ChatbotContext.Provider 
      value={{ 
        isOpen, 
        setIsOpen, 
        pageContext, 
        setPageContext,
        addPageSpecificMessage,
        messages,
        addMessage,
        clearMessages,
        savedChats,
        currentChatId,
        saveCurrentChat,
        loadChat,
        deleteChat,
        isProcessing,
        setIsProcessing,
        isMuted,
        toggleMute,
        fontSize,
        setFontSize
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};
