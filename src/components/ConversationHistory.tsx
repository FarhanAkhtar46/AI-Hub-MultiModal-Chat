import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bot, Clock } from "lucide-react";

interface ModelResponse {
  model: string;
  output: string;
  latency_ms: number;
  finish_reason?: string | null;
  usage?: Record<string, unknown> | null;
  error?: string | null;
}

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
  model_responses?: ModelResponse[] | null;
}

interface ConversationHistoryProps {
  messages: ChatMessage[];
}

const MODEL_CONFIG = {
  openai: {
    name: 'OpenAI',
    color: 'text-blue-500',
    borderColor: 'border-blue-500/20'
  },
  anthropic: {
    name: 'Anthropic',
    color: 'text-orange-500',
    borderColor: 'border-orange-500/20'
  },
  google: {
    name: 'Google',
    color: 'text-green-500',
    borderColor: 'border-green-500/20'
  },
  mistral: {
    name: 'Mistral',
    color: 'text-purple-500',
    borderColor: 'border-purple-500/20'
  },
  perplexity: {
    name: 'Perplexity',
    color: 'text-red-500',
    borderColor: 'border-red-500/20'
  }
};

export const ConversationHistory = ({ messages }: ConversationHistoryProps) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No messages yet</p>
        <p className="text-xs">Start a conversation to see the history here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-4 pr-4">
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            {/* User Message */}
            {message.role === 'user' && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <Card className="flex-1 bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-primary">You</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Assistant Responses */}
            {message.role === 'assistant' && message.model_responses && (
              <div className="space-y-3">
                {message.model_responses.map((response, respIndex) => {
                  const config = MODEL_CONFIG[response.model as keyof typeof MODEL_CONFIG] || {
                    name: response.model,
                    color: 'text-gray-500',
                    borderColor: 'border-gray-500/20'
                  };

                  return (
                    <div key={respIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Card className={`flex-1 border ${config.borderColor}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${config.color}`}>
                              {config.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTime(message.timestamp)}
                              <Badge variant="outline" className="text-xs">
                                {response.latency_ms}ms
                              </Badge>
                            </div>
                          </div>
                          
                          {response.error ? (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                              Error: {response.error}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {response.output}
                              </p>
                              
                              {response.usage && (
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  {response.usage.prompt_tokens && (
                                    <span>Prompt: {response.usage.prompt_tokens}</span>
                                  )}
                                  {response.usage.completion_tokens && (
                                    <span>Completion: {response.usage.completion_tokens}</span>
                                  )}
                                  {response.usage.total_tokens && (
                                    <span>Total: {response.usage.total_tokens}</span>
                                  )}
                                </div>
                              )}
                              
                              {response.finish_reason && (
                                <Badge variant="secondary" className="text-xs">
                                  {response.finish_reason}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
