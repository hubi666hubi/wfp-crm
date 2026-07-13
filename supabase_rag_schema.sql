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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the cosine similarity search function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity,
    documents.metadata
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Create an HNSW index to speed up similarity query lookups
CREATE INDEX IF NOT EXISTS documents_embedding_hnsw_idx 
ON documents 
USING hnsw (embedding vector_cosine_ops);
