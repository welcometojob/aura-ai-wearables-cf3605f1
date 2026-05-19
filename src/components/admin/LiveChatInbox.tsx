import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type ProfileInfo = {
  display_name: string | null;
  email?: string | null;
  avatar_url: string | null;
};

type Conversation = {
  id: string;
  user_id: string;
  last_message_at: string;
  unread_for_admin: number;
  unread_for_user: number;
  created_at: string;
  profiles?: ProfileInfo | ProfileInfo[] | null;
  lastMessage?: string;
};

type ConversationRow = Omit<Conversation, "profiles" | "lastMessage">;

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_role: "user" | "admin";
  sender_id: string;
  body: string;
  created_at: string;
};

function profileFor(conversation: Conversation): ProfileInfo | null {
  const profile = conversation.profiles;
  return Array.isArray(profile) ? profile[0] ?? null : profile ?? null;
}

function displayName(conversation: Conversation) {
  const profile = profileFor(conversation);
  return profile?.display_name || profile?.email || `User ${conversation.user_id.slice(0, 8)}`;
}

function initials(conversation: Conversation) {
  return displayName(conversation).slice(0, 2).toUpperCase();
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function LiveChatInbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => conversations.find((item) => item.id === selectedId) ?? null, [conversations, selectedId]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("last_message_at", { ascending: false });
    if (error) throw error;
    const rows = ((data as ConversationRow[] | null) ?? []).map((row) => ({ ...row, profiles: null, lastMessage: "" }));
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const profilesByUser = new Map<string, ProfileInfo>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id,display_name,avatar_url")
        .in("user_id", userIds);
      (profiles as Array<{ user_id: string; display_name: string | null; avatar_url: string | null }> | null)?.forEach((profile) => {
        profilesByUser.set(profile.user_id, { display_name: profile.display_name, avatar_url: profile.avatar_url });
      });
    }
    const rowsWithProfiles = rows.map((row) => ({ ...row, profiles: profilesByUser.get(row.user_id) ?? null }));
    const withPreviews = await Promise.all(rowsWithProfiles.map(async (conversation) => {
      const { data: last } = await supabase
        .from("chat_messages")
        .select("body")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...conversation, lastMessage: (last as { body?: string } | null)?.body ?? "" };
    }));
    setConversations(withPreviews);
    setSelectedId((current) => current ?? withPreviews[0]?.id ?? null);
  };

  useEffect(() => {
    loadConversations()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load conversations"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const loadMessages = async () => {
      setThreadLoading(true);
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", selectedId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!cancelled) setMessages((data as ChatMessage[] | null) ?? []);
        const { error: updateError } = await supabase
          .from("chat_conversations")
          .update({ unread_for_admin: 0 })
          .eq("id", selectedId);
        if (updateError) throw updateError;
        if (!cancelled) setConversations((prev) => prev.map((item) => item.id === selectedId ? { ...item, unread_for_admin: 0 } : item));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load messages");
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    };
    void loadMessages();
    return () => { cancelled = true; };
  }, [selectedId]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-live-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const next = payload.new as ChatMessage;
        setConversations((prev) => {
          const updated = prev.map((conversation) => conversation.id === next.conversation_id
            ? {
                ...conversation,
                last_message_at: next.created_at,
                lastMessage: next.body,
                unread_for_admin: selectedId === next.conversation_id || next.sender_role === "admin" ? conversation.unread_for_admin : conversation.unread_for_admin + 1,
              }
            : conversation);
          return [...updated].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        });
        if (selectedId === next.conversation_id) {
          setMessages((prev) => prev.some((message) => message.id === next.id) ? prev : [...prev, next]);
          if (next.sender_role === "user") {
            void supabase.from("chat_conversations").update({ unread_for_admin: 0 }).eq("id", next.conversation_id);
          }
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setMobileThreadOpen(true);
  };

  const sendMessage = async () => {
    const text = body.trim();
    if (!text || !user || !selected) return;
    setBody("");
    try {
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: selected.id,
        sender_role: "admin",
        sender_id: user.id,
        body: text,
      });
      if (error) throw error;
      const unread = selected.unread_for_user + 1;
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("chat_conversations")
        .update({ last_message_at: now, unread_for_user: unread })
        .eq("id", selected.id);
      if (updateError) throw updateError;
      setConversations((prev) => prev.map((conversation) => conversation.id === selected.id ? { ...conversation, last_message_at: now, unread_for_user: unread, lastMessage: text } : conversation));
    } catch (error) {
      setBody(text);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  if (loading) {
    return <div className="grid min-h-[480px] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[calc(100vh-220px)] min-h-[560px] overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="flex h-full">
        <aside className={`${mobileThreadOpen ? "hidden" : "flex"} w-full flex-col border-r border-border md:flex md:w-80`}>
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageCircle className="h-5 w-5 text-primary" /> Live Chat</h2>
            <p className="text-xs text-muted-foreground">Customer support inbox</p>
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>
            ) : conversations.map((conversation) => {
              const active = conversation.id === selectedId;
              const profile = profileFor(conversation);
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`flex w-full gap-3 border-b border-border/60 p-3 text-left transition ${active ? "bg-primary/10" : "hover:bg-muted/60"}`}
                >
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName(conversation)} />
                    <AvatarFallback>{initials(conversation)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{displayName(conversation)}</p>
                      <span className="text-[10px] text-muted-foreground">{relativeTime(conversation.last_message_at)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">{conversation.lastMessage || "No messages yet"}</p>
                      {conversation.unread_for_admin > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {conversation.unread_for_admin}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        </aside>

        <section className={`${mobileThreadOpen ? "flex" : "hidden"} flex-1 flex-col md:flex`}>
          {selected ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-4">
                <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileThreadOpen(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar>
                  <AvatarImage src={profileFor(selected)?.avatar_url ?? undefined} alt={displayName(selected)} />
                  <AvatarFallback>{initials(selected)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{displayName(selected)}</p>
                  <p className="text-xs text-muted-foreground">Customer conversation</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {threadLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
                  {!threadLoading && messages.length === 0 && <div className="text-center text-sm text-muted-foreground">No messages in this conversation.</div>}
                  {messages.map((message) => {
                    const admin = message.sender_role === "admin";
                    return (
                      <div key={message.id} className={`flex ${admin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${admin ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground"}`}>
                          <div className="whitespace-pre-wrap break-words">{message.body}</div>
                          <div className={`mt-1 text-[10px] ${admin ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{messageTime(message.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
              <form
                onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}
                className="flex items-end gap-2 border-t border-border p-3"
              >
                <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type a reply…" rows={2} className="resize-none" />
                <Button type="submit" size="icon" disabled={!body.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center text-muted-foreground">Select a conversation to start replying.</div>
          )}
        </section>
      </div>
    </div>
  );
}
