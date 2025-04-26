-- SQL command to add a 'model' column to the imageapi table in Supabase
ALTER TABLE imageapi ADD COLUMN model TEXT DEFAULT 'openai';
