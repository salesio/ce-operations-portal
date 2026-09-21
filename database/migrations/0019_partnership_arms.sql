-- Migration 0019: Partnership Arms Table & Schema Definition
-- Creates public.partnership_arms table with RLS policies and logo_url support.

CREATE TABLE IF NOT EXISTS public.partnership_arms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'bi-stars',
    logo_url TEXT,
    monthly_goal NUMERIC DEFAULT 10000,
    status TEXT DEFAULT 'Active',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.partnership_arms ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'partnership_arms' AND policyname = 'Allow public read access on partnership_arms'
    ) THEN
        CREATE POLICY "Allow public read access on partnership_arms"
            ON public.partnership_arms FOR SELECT
            USING (true);
    END IF;
END $$;

-- Allow public insert/update/delete access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'partnership_arms' AND policyname = 'Allow all access on partnership_arms'
    ) THEN
        CREATE POLICY "Allow all access on partnership_arms"
            ON public.partnership_arms FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
