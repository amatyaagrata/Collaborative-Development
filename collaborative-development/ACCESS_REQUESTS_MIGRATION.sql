-- ============================================================
-- ACCESS REQUESTS MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Create the access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT        NOT NULL,
  email            TEXT        UNIQUE NOT NULL,
  phone            TEXT,
  requested_role   TEXT        NOT NULL DEFAULT 'inventory manager',
  reason           TEXT,
  terms_accepted   BOOLEAN     NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ DEFAULT now(),
  status           TEXT        NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by      UUID        REFERENCES auth.users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  CONSTRAINT access_requests_status_check    CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT access_requests_role_check      CHECK (requested_role IN ('supplier', 'transporter', 'inventory manager'))
);

-- Enable Row Level Security
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (even unauthenticated) can INSERT a new request
CREATE POLICY "Anyone can submit requests"
  ON public.access_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role (used by admin API routes) has full access
CREATE POLICY "Service role full access"
  ON public.access_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- Index for fast status filtering
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email  ON public.access_requests(email);
