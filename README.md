# OpenAI Image Generator - Node.js Version

A full-stack web application that allows users to generate and edit images using OpenAI's Image API. Users can input prompts to generate images from scratch or upload reference images to create variations.

![OpenAI Image Generator](https://i.imgur.com/placeholder-screenshot.png)

## Features

- Generate images from text prompts using OpenAI's Image API
- Upload and edit existing images with AI
- Customize image output (size, quality, format, transparency)
- Save generated images to a gallery
- Download generated images
- Responsive design for desktop and mobile
- Secure API key handling with server-side implementation

## Tech Stack

- Node.js & Express (Backend)
- HTML, CSS, JavaScript (Frontend)
- OpenAI API (Image generation)
- Supabase (Database for storing images)
- Vercel (Deployment)

## Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)
- [OpenAI API key](https://platform.openai.com/api-keys)
- [Supabase account](https://supabase.com/)
- [GitHub account](https://github.com/)
- [Vercel account](https://vercel.com/)

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/openai-image-generator.git
   cd openai-image-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example`:
   ```
   # OpenAI API Configuration
   OPENAI_API_KEY=your-openai-api-key-here

   # Supabase Configuration
   SUPABASE_URL=your-supabase-url-here
   SUPABASE_KEY=your-supabase-anon-key-here

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
/imageapi
├── /public            # Static frontend files
│   ├── index.html     # Main HTML file
│   ├── styles.css     # CSS styles
│   └── script.js      # Frontend JavaScript
├── /src               # Server-side code
│   ├── /controllers   # Request handlers
│   ├── /routes        # API routes
│   ├── /services      # Business logic
│   ├── /utils         # Helper functions
│   └── server.js      # Express app setup
├── .env               # Environment variables
├── .env.example       # Environment template
├── .gitignore         # Git ignore file
├── package.json       # Node.js dependencies
├── README.md          # Documentation
└── vercel.json        # Vercel deployment config
```

## Supabase Database Setup

1. Create a new project in [Supabase](https://supabase.com/).

2. Create a new table named `imageapi` with the following schema:

   | Column Name | Type | Default | Primary | Notes |
   |-------------|------|---------|---------|-------|
   | id | uuid | gen_random_uuid() | Yes (PK) | Auto-generated UUID |
   | prompt | text | | | The text prompt used to generate the image |
   | image_data | text | | | Base64 encoded image data |
   | format | text | 'png' | | Image format (png, jpeg, webp) |
   | created_at | timestamp with time zone | now() | | Creation timestamp |

3. Set up Row Level Security (RLS) policies as needed for your application.

4. Get your Supabase URL and anon key from the project settings and add them to your `.env` file.

## API Endpoints

The application exposes the following API endpoints:

### Image Generation

- `POST /api/images/generate` - Generate an image from a text prompt
  - Request body: `{ prompt, size, quality, format, compression, transparent }`
  - Response: `{ status, data: { b64_json, format } }`

- `POST /api/images/edit` - Edit images using AI
  - Request body: FormData with `prompt`, `images` (files), and optional parameters
  - Response: `{ status, data: { b64_json, format } }`

### Gallery Management

- `GET /api/gallery` - Get all images from the gallery
  - Response: `{ status, results, data }`

- `POST /api/gallery` - Save an image to the gallery
  - Request body: `{ prompt, imageData, format }`
  - Response: `{ status, data }`

- `GET /api/gallery/:id` - Get a specific image by ID
  - Response: `{ status, data }`

- `DELETE /api/gallery/:id` - Delete an image from the gallery
  - Response: `{ status, message }`

## Deployment to Vercel

### Option 1: Deploy from GitHub

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/openai-image-generator.git
   git push -u origin main
   ```

2. Log in to [Vercel](https://vercel.com/) and import your GitHub repository.

3. Configure environment variables in the Vercel project settings:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `NODE_ENV`: Set to `production`

4. Deploy the project.

### Option 2: Deploy with Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your project:
   ```bash
   vercel --prod
   ```

4. Configure environment variables:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_KEY
   vercel env add NODE_ENV production
   ```

## Environment Variables

For security reasons, it's important to keep your API keys private. Here's how to handle environment variables:

### Local Development

For local development, you can use the `.env` file with your API keys. This file is included in `.gitignore` to prevent it from being committed to your repository.

### Production Deployment

When deploying to Vercel, use environment variables in the Vercel project settings. These will be securely stored and injected into your application at runtime.

The Node.js backend will automatically load these environment variables using the `dotenv` package, making them available to your application.

## Security Improvements

This Node.js version includes several security improvements over a client-side only implementation:

1. **API Key Protection**: API keys are stored on the server and never exposed to the client
2. **Rate Limiting**: Prevents abuse with configurable rate limits
3. **Input Validation**: Server-side validation of all inputs
4. **Error Handling**: Centralized error handling with appropriate status codes
5. **Security Headers**: Added with Helmet middleware
6. **CORS Protection**: Configured to restrict access as needed

## Usage

1. Enter a text prompt describing the image you want to generate.
2. (Optional) Upload one or more reference images.
3. Configure image options (size, quality, format, etc.).
4. Click "Generate Image" to create your image.
5. Download the generated image or save it to your gallery.
6. View and manage your saved images in the gallery section.

## Additional Security Considerations

- **Rate Limiting**: The application includes rate limiting, but you may need to adjust the limits based on your expected usage.
- **Content Moderation**: OpenAI has content filters, but consider implementing additional moderation if your application is public-facing.
- **Authentication**: For a production application, consider adding user authentication to protect the API endpoints.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OpenAI](https://openai.com/) for providing the Image API
- [Supabase](https://supabase.com/) for the database service
- [Vercel](https://vercel.com/) for hosting
