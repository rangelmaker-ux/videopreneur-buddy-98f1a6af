-- Tabela de roteiros
CREATE TABLE public.scripts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fixed_client_id UUID REFERENCES public.fixed_clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own scripts" 
ON public.scripts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts" 
ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts" 
ON public.scripts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts" 
ON public.scripts FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_scripts_updated_at
BEFORE UPDATE ON public.scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();