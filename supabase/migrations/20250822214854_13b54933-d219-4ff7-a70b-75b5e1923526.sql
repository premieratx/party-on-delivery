-- Create media library storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media-library', 'media-library', true);

-- Create media library table to track uploads
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  mime_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration NUMERIC, -- for videos
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Admin can manage all media
CREATE POLICY "Admins can manage all media" 
ON public.media_library 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Public can view active media
CREATE POLICY "Public can view media" 
ON public.media_library 
FOR SELECT 
USING (true);

-- Storage policies for media library
CREATE POLICY "Admins can upload to media library" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'media-library' AND is_admin_user_safe());

CREATE POLICY "Admins can update media library files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'media-library' AND is_admin_user_safe());

CREATE POLICY "Admins can delete media library files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'media-library' AND is_admin_user_safe());

CREATE POLICY "Public can view media library files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media-library');

-- Create function to update media library updated_at
CREATE OR REPLACE FUNCTION public.update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_library_updated_at();