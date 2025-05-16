
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, Volume, VolumeX, Trash2, Save, FileText, 
  Download, UploadCloud, RefreshCw 
} from "lucide-react";
import { useChatbot } from '@/contexts/ChatbotContext';
import { useToast } from '@/hooks/use-toast';

interface ChatSettingsProps {
  onClearChat: () => void;
  onSaveChat: () => void;
  onExportChat: () => void;
  onImportChat: () => void;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({
  onClearChat,
  onSaveChat,
  onExportChat,
  onImportChat
}) => {
  const { toast } = useToast();
  const { 
    isMuted, 
    toggleMute, 
    fontSize, 
    setFontSize 
  } = useChatbot();

  const handleFontSizeChange = (value: number[]) => {
    const sizeMap: Record<number, "small" | "medium" | "large"> = {
      0: "small",
      1: "medium",
      2: "large"
    };
    
    const size = sizeMap[value[0]];
    if (size) {
      setFontSize(size);
    }
  };

  const getFontSizeValue = (): number => {
    switch (fontSize) {
      case "small": return 0;
      case "medium": return 1;
      case "large": return 2;
      default: return 1;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3">
        <div className="space-y-3">
          <h4 className="text-sm font-medium mb-2">Chat Settings</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume className="h-4 w-4" />}
              <Label htmlFor="mute-toggle">Sound</Label>
            </div>
            <Switch
              id="mute-toggle"
              checked={!isMuted}
              onCheckedChange={() => toggleMute()}
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">Text Size</Label>
              <span className="text-xs text-muted-foreground capitalize">{fontSize}</span>
            </div>
            <Slider
              id="font-size"
              max={2}
              step={1}
              value={[getFontSizeValue()]}
              onValueChange={handleFontSizeChange}
              className="w-full"
            />
          </div>
          
          <hr className="my-2 border-muted" />
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-start text-xs"
              onClick={onClearChat}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Clear Chat
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-start text-xs"
              onClick={onSaveChat}
            >
              <Save className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Save Chat
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-start text-xs"
              onClick={onExportChat}
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-start text-xs"
              onClick={onImportChat}
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Import
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChatSettings;
