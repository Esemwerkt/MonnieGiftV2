-- Check the current gifts table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gifts' 
AND table_schema = 'public'
ORDER BY ordinal_position;
