# Multi-Modal AI Analysis App

A Next.js application that analyzes text, images, and videos using **Cloudflare Workers AI** (`llama-4-scout-17b-16e-instruct`) with in-memory vector storage for semantic search.

## Features

- 📝 **Text Analysis**: Upload text files for AI-powered analysis
- 🖼️ **Image Analysis**: Upload images for visual content understanding
- 🎥 **Video Analysis**: Upload videos for content analysis
- 🔍 **Semantic Search**: Search through analyzed content using natural language
- 💾 **Vector Storage**: In-memory vector storage with cosine similarity search
- ⚡ **Real-time Results**: See analysis results immediately after upload
- ☁️ **Cloud-Powered**: Uses Cloudflare Workers AI for inference

## Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher)
2. **Cloudflare Account** with Workers AI enabled
3. **Cloudflare API Token**

## Setup Instructions

### 1. Get Cloudflare Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **AI**
3. Copy your **Account ID** from the dashboard URL (e.g., `https://dash.cloudflare.com/YOUR_ACCOUNT_ID/ai/workers-ai`)
4. Create an API Token:
   - Go to **Profile** → **API Tokens**
   - Click **Create Token**
   - Use template "Edit Workers AI" or create custom with Workers AI permissions
   - Copy the generated token

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Cloudflare credentials:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

**Important:** Replace `your_account_id_here` and `your_api_token_here` with your actual Cloudflare credentials.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select File Type**: Choose whether you're uploading text, image, or video
2. **Choose File**: Select a file from your computer
3. **Upload and Analyze**: Click the button to upload and get AI analysis via Cloudflare Workers AI
4. **View Results**: See the analysis results and browse all analyzed files
5. **Search**: Use semantic search to find relevant analyzed content

## API Routes

- `POST /api/upload` - Upload and analyze files using Cloudflare Workers AI
- `POST /api/search` - Semantic search through analyzed content
- `GET /api/results` - Fetch all analyzed files

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **AI Model**: Llama 4 Scout (`@cf/meta/llama-4-scout-17b-16e-instruct`) via Cloudflare Workers AI
- **Embeddings**: BGE Base EN v1.5 (`@cf/baai/bge-base-en-v1.5`) via Cloudflare
- **Vector Storage**: In-memory vector store with cosine similarity
- **Language**: TypeScript

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/      # File upload and analysis endpoint
│   │   ├── search/      # Semantic search endpoint
│   │   └── results/     # Fetch all results endpoint
│   ├── page.tsx         # Main page
│   └── layout.tsx       # Root layout
├── components/
│   ├── FileUpload.tsx   # File upload component
│   └── ResultsDisplay.tsx # Results and search component
└── lib/
    ├── vectorstore.ts   # In-memory vector storage
    └── cloudflare-ai.ts # Cloudflare Workers AI integration
```

## How It Works

1. **File Upload**: Users upload text, image, or video files
2. **AI Analysis**: Cloudflare Workers AI (Llama 4 Scout) analyzes the content
3. **Embedding Generation**: Text embeddings are generated using BGE model
4. **Vector Storage**: Embeddings and analysis are stored in-memory
5. **Semantic Search**: Cosine similarity search enables natural language queries

## Models Used

- **Text/Image/Video Analysis**: `@cf/meta/llama-4-scout-17b-16e-instruct`
- **Text Embeddings**: `@cf/baai/bge-base-en-v1.5`

## Troubleshooting

### API Authentication Errors
- Verify your `CLOUDFLARE_ACCOUNT_ID` is correct
- Ensure your `CLOUDFLARE_API_TOKEN` has Workers AI permissions
- Check that your Cloudflare account has Workers AI enabled

### Rate Limits
- Cloudflare Workers AI has rate limits on the free tier
- Consider upgrading to paid plan for higher limits

### Check Cloudflare Status
Visit your [Cloudflare AI Dashboard](https://dash.cloudflare.com) to verify:
- Workers AI is enabled
- Your API token is valid
- Usage and limits

## Notes

- Vector storage is **in-memory** and will be cleared when the server restarts
- For production, consider using Cloudflare Vectorize or another persistent vector database
- Cloudflare Workers AI runs on Cloudflare's global network for fast inference

## License

MIT