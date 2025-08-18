import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { KeyboardEvent } from "react";

interface ChatInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput = ({ prompt, onPromptChange, onSend, isLoading, disabled }: ChatInputProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !disabled && prompt.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt to compare AI model responses..."
            className="min-h-[120px] resize-none bg-input/50 border-border/50 focus:border-primary/50 transition-colors"
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Press Enter to send • Shift+Enter for new line</span>
        </div>
        
        <Button
          onClick={onSend}
          disabled={!prompt.trim() || isLoading || disabled}
          className="bg-gradient-primary hover:bg-gradient-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-glow"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send to Models
            </>
          )}
        </Button>
      </div>
      
      {disabled && (
        <div className="text-center py-2">
          <span className="text-sm text-muted-foreground">
            Please select at least one AI model to continue
          </span>
        </div>
      )}
    </div>
  );
};