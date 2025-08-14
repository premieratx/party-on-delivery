-- Create party planning agents table
CREATE TABLE IF NOT EXISTS public.party_planning_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  voice TEXT NOT NULL DEFAULT 'nova',
  tone TEXT NOT NULL DEFAULT 'enthusiastic',
  description TEXT,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.party_planning_agents ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for demo)
CREATE POLICY "Anyone can view party planning agents" ON public.party_planning_agents FOR SELECT USING (true);
CREATE POLICY "Anyone can create party planning agents" ON public.party_planning_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update party planning agents" ON public.party_planning_agents FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete party planning agents" ON public.party_planning_agents FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_party_planning_agents_updated_at
    BEFORE UPDATE ON public.party_planning_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();