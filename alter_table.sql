-- SQL command to add a 'model' column to the imageapi table in Supabase
ALTER TABLE imageapi ADD COLUMN model TEXT DEFAULT 'openai';

-- SQL command to add a 'uploaded_thumbnail' column to the imageapi table in Supabase for storing base64-encoded thumbnail of the original uploaded image
ALTER TABLE imageapi ADD COLUMN uploaded_thumbnail TEXT;
