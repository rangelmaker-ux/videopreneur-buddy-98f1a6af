-- Create roteirista_chats table
CREATE TABLE public.roteirista_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create roteirista_messages table
CREATE TABLE public.roteirista_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.roteirista_chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.roteirista_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteirista_messages ENABLE ROW LEVEL SECURITY;

-- Policies for roteirista_chats
CREATE POLICY "Users can view their own roteirista chats"
    ON public.roteirista_chats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roteirista chats"
    ON public.roteirista_chats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roteirista chats"
    ON public.roteirista_chats FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roteirista chats"
    ON public.roteirista_chats FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for roteirista_messages
CREATE POLICY "Users can view messages from their own roteirista chats"
    ON public.roteirista_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.roteirista_chats
            WHERE public.roteirista_chats.id = public.roteirista_messages.chat_id
            AND public.roteirista_chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages into their own roteirista chats"
    ON public.roteirista_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.roteirista_chats
            WHERE public.roteirista_chats.id = public.roteirista_messages.chat_id
            AND public.roteirista_chats.user_id = auth.uid()
        )
    );
