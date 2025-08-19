import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Zap, Brain, Sparkles, Bot, MessageSquare } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { ResponseCard } from "@/components/ResponseCard";
import { ChatInput } from "@/components/ChatInput";
import { ChatSessions } from "@/components/ChatSessions";
import { ConversationHistory } from "@/components/ConversationHistory";

type ApiModelResponse = {
  model: string;
  output: string;
  latency_ms: number;
  finish_reason?: string | null;
  usage?: Record<string, unknown> | null;
  error?: string | null;
};

type ApiChatResponse = {
  responses: ApiModelResponse[];
};

type ChatSession = {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    model_responses?: ApiModelResponse[] | null;
  }>;
  created_at: string;
  updated_at: string;
};

const UI_TO_PROVIDER: Record<string, string> = {
  gpt: "openai",
  claude: "anthropic",
  gemini: "google",
  grok: "perplexity",
};

const PROVIDER_TO_UI: Record<string, string> = {
  openai: "gpt",
  anthropic: "claude",
  google: "gemini",
  perplexity: "grok",
};

const Index = () => {
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt', 'claude']);
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  const handleSendPrompt = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    setResponses({});

    try {
      const providerModels = selectedModels
        .map((m) => UI_TO_PROVIDER[m])
        .filter((m): m is string => Boolean(m));

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          models: providerModels,
          system_prompt: null,
          temperature: 0.7,
          max_tokens: 512,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Request failed: ${resp.status}`);
      }

      const data: ApiChatResponse = await resp.json();

      const aggregated: Record<string, string> = {};
      for (const r of data.responses) {
        const uiKey = PROVIDER_TO_UI[r.model] || r.model;
        aggregated[uiKey] = r.output || r.error || "";
      }
      setResponses(aggregated);
    } catch (err) {
      console.error(err);
      const errorMsg = "Failed to get responses. Check backend and API keys.";
      const aggregated: Record<string, string> = {};
      for (const m of selectedModels) aggregated[m] = errorMsg;
      setResponses(aggregated);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || selectedModels.length === 0 || !selectedSession) return;

    setIsLoading(true);
    setResponses({});

    try {
      const providerModels = selectedModels
        .map((m) => UI_TO_PROVIDER[m])
        .filter((m): m is string => Boolean(m));

      const resp = await fetch(`/api/sessions/${selectedSession.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: selectedSession.id,
          content: prompt,
          models: providerModels,
          system_prompt: null,
          temperature: 0.7,
          max_tokens: 512,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Request failed: ${resp.status}`);
      }

      const data: ApiChatResponse = await resp.json();

      const aggregated: Record<string, string> = {};
      for (const r of data.responses) {
        const uiKey = PROVIDER_TO_UI[r.model] || r.model;
        aggregated[uiKey] = r.output || r.error || "";
      }
      setResponses(aggregated);

      // Refresh the session to get updated messages
      const sessionResp = await fetch(`/api/sessions/${selectedSession.id}`, { headers });
      if (sessionResp.ok) {
        const sessionData = await sessionResp.json();
        setSelectedSession(sessionData.session);
      }

      setPrompt("");
    } catch (err) {
      console.error(err);
      const errorMsg = "Failed to get responses. Check backend and API keys.";
      const aggregated: Record<string, string> = {};
      for (const m of selectedModels) aggregated[m] = errorMsg;
      setResponses(aggregated);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = () => {
    setShowNewMessageForm(true);
    setPrompt("");
    setResponses({});
  };

  const handleSessionSelect = (session: ChatSession | null) => {
    setSelectedSession(session);
    setShowNewMessageForm(false);
    setPrompt("");
    setResponses({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  AI Hub
                </h1>
                <p className="text-sm text-muted-foreground">
                  Compare LLM responses with persistent chat history
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-primary border-primary/20">
              <Zap className="h-3 w-3 mr-1" />
              Multi-Model AI
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Chat Sessions */}
            <ChatSessions
              selectedSession={selectedSession}
              onSessionSelect={handleSessionSelect}
              onNewMessage={handleNewMessage}
            />

            {/* AI Models */}
            <Card className="bg-gradient-card border-border/50 shadow-soft sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Models
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSelector 
                  selectedModels={selectedModels}
                  onSelectionChange={setSelectedModels}
                />
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Selected Models</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModels.map(model => (
                      <Badge 
                        key={model} 
                        variant="secondary"
                        className={`capitalize ${
                          model === 'gpt' ? 'border-gpt-primary/20 text-gpt-primary' :
                          model === 'claude' ? 'border-claude-primary/20 text-claude-primary' :
                          model === 'gemini' ? 'border-gemini-primary/20 text-gemini-primary' :
                          'border-grok-primary/20 text-grok-primary'
                        }`}
                      >
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Session Info */}
            {selectedSession && (
              <Card className="bg-gradient-card border-border/50 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{selectedSession.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {selectedSession.messages.length} messages
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSession(null)}
                    >
                      Close Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conversation History */}
            {selectedSession && (
              <Card className="bg-gradient-card border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConversationHistory messages={selectedSession.messages} />
                </CardContent>
              </Card>
            )}

            {/* Prompt Input */}
            {selectedSession && showNewMessageForm && (
              <Card className="bg-gradient-card border-border/50 shadow-soft">
                <CardContent className="p-6">
                  <ChatInput
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    disabled={selectedModels.length === 0}
                  />
                </CardContent>
              </Card>
            )}

            {/* Legacy Single Prompt (when no session) */}
            {!selectedSession && (
              <Card className="bg-gradient-card border-border/50 shadow-soft">
                <CardContent className="p-6">
                  <ChatInput
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    onSend={handleSendPrompt}
                    isLoading={isLoading}
                    disabled={selectedModels.length === 0}
                  />
                </CardContent>
              </Card>
            )}

            {/* Responses Grid */}
            {(Object.keys(responses).length > 0 || isLoading) && (
              <div className="grid gap-6 md:grid-cols-2">
                {selectedModels.map(model => (
                  <ResponseCard
                    key={model}
                    model={model}
                    response={responses[model]}
                    isLoading={isLoading && !responses[model]}
                    prompt={prompt}
                  />
                ))}
              </div>
            )}

            {/* Welcome Message */}
            {Object.keys(responses).length === 0 && !isLoading && !selectedSession && (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Brain className="h-16 w-16 text-primary/60" />
                    <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Welcome to AI Hub
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create a chat session to start a conversation with multiple AI models, or use the single prompt mode for quick comparisons.
                </p>
                <div className="flex justify-center">
                  <Badge variant="outline" className="text-primary border-primary/20">
                    Create a session to get started
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;