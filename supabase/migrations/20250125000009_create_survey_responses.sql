-- Create survey_responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_id TEXT REFERENCES public.gifts(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  improvements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert survey responses
CREATE POLICY "Anyone can submit survey responses"
  ON public.survey_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow service role to read all survey responses
CREATE POLICY "Service role can read all survey responses"
  ON public.survey_responses
  FOR SELECT
  TO service_role
  USING (true);

-- Create index on gift_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_survey_responses_gift_id ON public.survey_responses(gift_id);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.survey_responses(created_at);

