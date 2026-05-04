-- Ready-made design assets (PNG t-shirt designs)
CREATE TABLE public.ready_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  image_url TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ready_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ready designs are viewable by everyone"
ON public.ready_designs FOR SELECT
USING (true);

CREATE POLICY "Admins can insert ready designs"
ON public.ready_designs FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ready designs"
ON public.ready_designs FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ready designs"
ON public.ready_designs FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ready_designs_updated_at
BEFORE UPDATE ON public.ready_designs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for ready design PNGs
INSERT INTO storage.buckets (id, name, public)
VALUES ('ready-designs', 'ready-designs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Ready designs public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'ready-designs');

CREATE POLICY "Admins can upload ready designs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ready-designs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ready design files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ready-designs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ready design files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ready-designs' AND has_role(auth.uid(), 'admin'::app_role));
