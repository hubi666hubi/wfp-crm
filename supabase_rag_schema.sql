-- ============================================================
-- WFP CRM OMEGA: VECTOR DATABASE SETUP FOR SUPABASE RAG
-- Execute this script in your Supabase SQL Editor
-- ============================================================

-- 1. Enable pgvector extension (requires pgvector supported database)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table to hold sales knowledge
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(768), -- text-embedding-004 model outputs 768 dimensions
    metadata JSONB DEFAULT '{}'::jsonb,
    fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: If table already exists, run:
-- ALTER TABLE documents ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

-- 3. Create an HNSW index to speed up similarity query lookups
CREATE INDEX IF NOT EXISTS documents_embedding_hnsw_idx 
ON documents 
USING hnsw (embedding vector_cosine_ops);

-- 4. Create a GIN index to speed up full-text search
CREATE INDEX IF NOT EXISTS documents_fts_idx 
ON documents 
USING gin (fts);

-- 5. Create the Hybrid Search function (Vector + FTS using RRF)
CREATE OR REPLACE FUNCTION hybrid_search (
  query_text TEXT,
  query_embedding VECTOR(768),
  match_count INT,
  full_text_weight FLOAT DEFAULT 1.0,
  semantic_weight FLOAT DEFAULT 1.0,
  rrf_k INT DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
WITH fts_search AS (
  SELECT
    id,
    content,
    metadata,
    rank() OVER (ORDER BY ts_rank(fts, websearch_to_tsquery('simple', query_text)) DESC) as text_rank
  FROM documents
  WHERE fts @@ websearch_to_tsquery('simple', query_text)
  ORDER BY text_rank
  LIMIT match_count * 2
),
vector_search AS (
  SELECT
    id,
    content,
    metadata,
    rank() OVER (ORDER BY embedding <=> query_embedding) as vector_rank,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents
  ORDER BY vector_rank
  LIMIT match_count * 2
)
SELECT
  COALESCE(f.id, v.id) AS id,
  COALESCE(f.content, v.content) AS content,
  -- Calculate RRF score
  (
    COALESCE(full_text_weight / (rrf_k + f.text_rank), 0.0) +
    COALESCE(semantic_weight / (rrf_k + v.vector_rank), 0.0)
  ) AS similarity,
  COALESCE(f.metadata, v.metadata) AS metadata
FROM fts_search f
FULL OUTER JOIN vector_search v ON f.id = v.id
ORDER BY similarity DESC
LIMIT match_count;
$$;
