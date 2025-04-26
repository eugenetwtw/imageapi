// OpenAI API Configuration
const OPENAI_API_KEY = 'your-openai-api-key-here';

// Supabase Configuration
const SUPABASE_URL = 'your-supabase-url-here';
const SUPABASE_KEY = 'your-supabase-anon-key-here';

// Make environment variables available globally
window.ENV = {
  OPENAI_API_KEY,
  SUPABASE_URL,
  SUPABASE_KEY
};

// Note: Replace the above values with your actual API keys
// For production, consider using environment variables with a backend service
