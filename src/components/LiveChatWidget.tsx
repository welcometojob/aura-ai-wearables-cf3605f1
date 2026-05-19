import { Link } from "@tanstack/react-router";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import brandMark from "@/assets/tommymeow-mark.png";

type Conversation = {
  id: string;
  user_id: string;
  last_message_at: string;
  unread_for_admin: number;
  unread_for_user: number;
  created_at: string;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_role: "user" | "admin";
  sender_id: string;
  body: string;
  created_at: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function LiveChatWidget() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hidden = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("aura:open-chat", handler);
    return () => window.removeEventListener("aura:open-chat", handler);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    const load = async () => {
      setBusy(true);
      try {
        const { data: existing, error: findError } = await supabase
          .from("chat_conversations")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (findError) throw findError;

        let conv = existing as Conversation | null;
        if (!conv) {
          const { data: created, error: createError } = await supabase
            .from("chat_conversations")
            .insert({ user_id: user.id })
            .select("*")
            .single();
          if (createError) throw createError;
          conv = created as Conversation;
        }
        if (cancelled) return;
        setConversation(conv);

        const { data: loadedMessages, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
        if (messagesError) throw messagesError;
        if (!cancelled) setMessages((loadedMessages as ChatMessage[] | null) ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load chat");
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [open, user]);

  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`user-chat-${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const next = payload.new as ChatMessage;
          setMessages((prev) => prev.some((m) => m.id === next.id) ? prev : [...prev, next]);
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = body.trim();
    if (!text || !user || !conversation) return;
    setBody("");
    try {
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversation.id,
        sender_role: "user",
        sender_id: user.id,
        body: text,
      });
      if (error) throw error;
      const unread = conversation.unread_for_admin + 1;
      const { error: updateError } = await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString(), unread_for_admin: unread })
        .eq("id", conversation.id);
      if (updateError) throw updateError;
      setConversation({ ...conversation, unread_for_admin: unread, last_message_at: new Date().toISOString() });
    } catch (error) {
      setBody(text);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Open live chat"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[calc(100vw-3rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
          <div className="flex items-center gap-3 border-b border-border bg-card/80 p-4">
            <img src={brandMark} alt="TommyMeow" className="h-9 w-9 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Live Support</div>
              <div className="text-[11px] text-muted-foreground">We typically reply soon</div>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!loading && !user ? (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div>
                <p className="text-sm font-medium text-foreground">Sign in to chat with us</p>
                <p className="mt-1 text-xs text-muted-foreground">Our support team is ready to help after you sign in.</p>
                <Button asChild variant="hero" className="mt-4">
                  <Link to="/auth" search={{ redirect: "/", plan: undefined }}>Sign in</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {busy && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
                  {!busy && messages.length === 0 && (
                    <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-foreground">Hey! How can we help you today?</div>
                  )}
                  {messages.map((message) => {
                    const own = message.sender_role === "user";
                    return (
                      <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground"}`}>
                          <div className="whitespace-pre-wrap break-words">{message.body}</div>
                          <div className={`mt-1 text-[10px] ${own ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{formatTime(message.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
              <form
                onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type your message…" className="bg-background" />
                <Button type="submit" size="icon" disabled={!body.trim() || !conversation}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
