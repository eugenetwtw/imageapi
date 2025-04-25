
-- SQL command to alter the imageapi table to add duration field
ALTER TABLE public.imageapi 
ADD COLUMN duration_seconds INTEGER DEFAULT 0,
ADD COLUMN is_edit BOOLEAN DEFAULT false,
ADD COLUMN source_type TEXT DEFAULT 'text';

