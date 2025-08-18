import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Zap, Sparkles, Bot, Copy, MoreVertical } from "lucide-react";
import { toast } from "sonner";

interface ResponseCardProps {
  model: string;
  response?: string;
  isLoading: boolean;
  prompt: string;
}

const MODEL_CONFIG = {
  gpt: {
    name: 'GPT-4',
    icon: Brain,
    gradient: 'bg-gradient-gpt',
    shadow: 'shadow-model-gpt',
    color: 'text-gpt-primary',
    borderColor: 'border-gpt-primary/20'
  },
  claude: {
    name: 'Claude',
    icon: Zap,
    gradient: 'bg-gradient-claude',
    shadow: 'shadow-model-claude',
    color: 'text-claude-primary',
    borderColor: 'border-claude-primary/20'
  },
  gemini: {
    name: 'Gemini',
    icon: Sparkles,
    gradient: 'bg-gradient-gemini',
    shadow: 'shadow-model-gemini',
    color: 'text-gemini-primary',
    borderColor: 'border-gemini-primary/20'
  },
  grok: {
    name: 'Grok',
    icon: Bot,
    gradient: 'bg-gradient-grok',
    shadow: 'shadow-model-grok',
    color: 'text-grok-primary',
    borderColor: 'border-grok-primary/20'
  }
};

export const ResponseCard = ({ model, response, isLoading, prompt }: ResponseCardProps) => {
  const config = MODEL_CONFIG[model as keyof typeof MODEL_CONFIG];
  const Icon = config.icon;

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      toast.success("Response copied to clipboard");
    }
  };

  return (
    <Card className={`${config.shadow} ${config.borderColor} border-opacity-50 transition-all duration-300 hover:scale-[1.02] bg-gradient-card`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <span className="text-foreground">{config.name}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {response && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={copyResponse}
                className="h-8 w-8 p-0 hover:bg-accent"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className={`w-fit ${config.borderColor} ${config.color} bg-opacity-10`}
        >
          {isLoading ? 'Generating...' : response ? 'Complete' : 'Pending'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prompt Echo */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground font-medium mb-1">Prompt:</p>
          <p className="text-sm text-foreground">{prompt}</p>
        </div>

        {/* Response */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Response:</p>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : response ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {response}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon className={`h-8 w-8 ${config.color} mx-auto mb-2 opacity-50`} />
              <p className="text-sm text-muted-foreground">Waiting for response...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};