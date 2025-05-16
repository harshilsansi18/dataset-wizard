
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SavedChat } from '@/contexts/ChatbotContext';
import { MessageSquare, Search, MoreVertical, Edit, Trash2, Clock } from "lucide-react";
import { format } from 'date-fns';

interface SavedChatsProps {
  savedChats: SavedChat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

const SavedChats: React.FC<SavedChatsProps> = ({
  savedChats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onRenameChat
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingChat, setEditingChat] = React.useState<{ id: string; title: string } | null>(null);

  const filteredChats = searchTerm 
    ? savedChats.filter(chat => 
        chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.previewMessage.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : savedChats;

  const handleSelect = (chatId: string) => {
    onSelectChat(chatId);
    setIsOpen(false);
  };

  const handleRename = () => {
    if (editingChat) {
      onRenameChat(editingChat.id, editingChat.title);
      setEditingChat(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full relative"
        >
          <MessageSquare className="h-4 w-4" />
          {savedChats.length > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Saved Chats</SheetTitle>
          </div>
          <SheetDescription>
            Your conversation history is saved locally on this device.
          </SheetDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredChats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No saved chats found</p>
              </div>
            )}
            
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`
                  p-3 rounded-lg border cursor-pointer 
                  hover:bg-muted/50 transition-colors
                  ${chat.id === currentChatId ? 'bg-primary/10 border-primary/30' : 'border-transparent'}
                `}
                onClick={() => handleSelect(chat.id)}
              >
                {editingChat && editingChat.id === chat.id ? (
                  <div className="flex items-center gap-2 mb-1">
                    <Input
                      value={editingChat.title}
                      onChange={(e) => setEditingChat({ ...editingChat, title: e.target.value })}
                      autoFocus
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') setEditingChat(null);
                      }}
                    />
                    <Button size="sm" onClick={handleRename}>Save</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{chat.title}</h4>
                    <div className="flex items-center">
                      <div className="text-xs text-muted-foreground flex items-center mr-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(chat.timestamp), 'MMM d')}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setEditingChat({ id: chat.id, title: chat.title });
                          }}>
                            <Edit className="h-3.5 w-3.5 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(chat.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground line-clamp-2">{chat.previewMessage}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default SavedChats;
