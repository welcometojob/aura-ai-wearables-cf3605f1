-- Table: chat_conversations (one conversation per user)
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  unread_for_admin int not null default 0,
  unread_for_user int not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- Table: chat_messages (each message)
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('user','admin')),
  sender_id uuid not null,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index idx_chat_messages_conv_created on public.chat_messages(conversation_id, created_at desc);
create index idx_chat_conversations_last_message on public.chat_conversations(last_message_at desc);

-- RLS enable
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

-- Policies: users can see/create/update their own conversation
create policy "users see own conversation" on public.chat_conversations
  for select using (auth.uid() = user_id);
create policy "users insert own conversation" on public.chat_conversations
  for insert with check (auth.uid() = user_id);
create policy "users update own conversation" on public.chat_conversations
  for update using (auth.uid() = user_id);

-- Admin can see/update all conversations
create policy "admin sees all conversations" on public.chat_conversations
  for all using (public.has_role(auth.uid(), 'admin'));

-- Messages: users can see/send messages in their own conversation
create policy "users see own messages" on public.chat_messages
  for select using (
    exists (select 1 from public.chat_conversations c
            where c.id = conversation_id and c.user_id = auth.uid())
  );
create policy "users send own messages" on public.chat_messages
  for insert with check (
    sender_role = 'user'
    and sender_id = auth.uid()
    and exists (select 1 from public.chat_conversations c
                where c.id = conversation_id and c.user_id = auth.uid())
  );

-- Admin can see/send all messages
create policy "admin all messages" on public.chat_messages
  for all using (public.has_role(auth.uid(), 'admin'));

-- Realtime enable
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_conversations;
