import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface ChatSessionsProps {
  selectedSession: ChatSession | null;
  onSessionSelect: (session: ChatSession | null) => void;
  onNewMessage: () => void;
}

export const ChatSessions = ({ selectedSession, onSessionSelect, onNewMessage }: ChatSessionsProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);

  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/sessions", { headers });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const createSession = async () => {
    if (!newSessionTitle.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({ title: newSessionTitle.trim() }),
      });
      
      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        setNewSessionTitle("");
        setShowNewSessionForm(false);
        onSessionSelect(newSession);
        toast.success("New chat session created");
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers,
      });
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
          onSessionSelect(null);
        }
        toast.success("Session deleted");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete session");
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat Sessions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewSessionForm(!showNewSessionForm)}
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* New Session Form */}
        {showNewSessionForm && (
          <div className="space-y-3 p-3 border border-border/50 rounded-lg bg-muted/30">
            <Input
              placeholder="Session title..."
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createSession()}
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={createSession}
                disabled={!newSessionTitle.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? "Creating..." : "Create Session"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewSessionForm(false);
                  setNewSessionTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chat sessions yet</p>
                <p className="text-xs">Create your first session to get started</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedSession?.id === session.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  }`}
                  onClick={() => onSessionSelect(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{session.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(session.updated_at)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {session.messages.length} messages
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Active Session Actions */}
        {selectedSession && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Active: </span>
                <span className="font-medium">{selectedSession.title}</span>
              </div>
              <Button size="sm" onClick={onNewMessage} className="h-8">
                New Message
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
