# Conversation AI Backend - Complete Setup Guide

A Node.js backend that integrates **Ollama**, **MongoDB**, and **LangChain** to build an AI application for conversational analysis of customer support tickets.

## 🚀 Features

- **Conversational Agent**: Natural conversation about conversation data stored in MongoDB
- **Smart Summarization**: AI-powered summaries of customer support conversations
- **Intelligent Clarification**: Asks follow-up questions for vague queries
- **Safe Query Generation**: Converts natural language to secure MongoDB queries
- **Single Endpoint Architecture**: One `/chat` endpoint handles all interactions

## 📋 Prerequisites

Before starting, ensure you have these installed:

### 1. Node.js (v18 or higher)
```bash
# Check if installed
node --version
npm --version

# Install from https://nodejs.org/ if needed
```

### 2. Docker & Docker Compose
```bash
# Check if installed
docker --version
docker-compose --version

# Install from https://docs.docker.com/get-docker/ if needed
```

### 3. Ollama
Install Ollama on your system:

**macOS/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [https://ollama.ai/download](https://ollama.ai/download)

**Verify Installation:**
```bash
ollama --version
```

## 🛠️ Installation & Setup

### Step 1: Clone & Install Dependencies

```bash
# Clone your project
git clone <your-repo-url>
cd conversation-ai-backend

# Install Node.js dependencies
npm install
```

### Step 2: Install Required Ollama Models

**Pull the AI models (this may take 10-15 minutes):**
```bash
# Start Ollama service (run in separate terminal)
ollama serve

# Pull required models (in another terminal)
ollama pull gemma:2b          # ~1.6GB - General conversation
ollama pull mistral:7b        # ~4.1GB - Summarization  
ollama pull deepseek-coder:6.7b  # ~3.8GB - Query generation

# Verify models are installed
ollama list
```

**Expected output:**
```
NAME                    ID              SIZE      MODIFIED
deepseek-coder:6.7b     e3b7a8d7a0a8    3.8 GB    2 hours ago
gemma:2b                fe1a2b3c4d5e    1.6 GB    2 hours ago
mistral:7b              a1b2c3d4e5f6    4.1 GB    2 hours ago
```

### Step 3: Start MongoDB with Docker

```bash
# Start MongoDB container
docker-compose up -d

# Verify MongoDB is running
docker-compose ps
```

**Expected output:**
```
NAME                     COMMAND                  SERVICE             STATUS
conversation-mongodb     "docker-entrypoint.s…"   mongodb             Up 5 seconds
```

### Step 4: Configure Environment

Create `.env` file in project root:
```bash
cp .env.example .env  # If you have an example file
# OR create manually:
```

**.env contents:**
```env
# MongoDB (with authentication for Docker setup)
MONGODB_URI=mongodb://admin:password@localhost:27017/conversations?authSource=admin
MONGODB_DATABASE=conversations

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# AI Models - Change these to use different Ollama models
CONVERSATION_MODEL=gemma:2b
SUMMARIZATION_MODEL=mistral:7b  
QUERY_MODEL=deepseek-coder:6.7b

# Server Config
PORT=3002
CORS_ORIGIN=http://localhost:5173

# Debug
DEBUG_ENABLED=true

# AI Configuration
SIMILARITY_THRESHOLD=0.8
```

### Step 5: Seed Database with Sample Data

```bash
# Generate sample conversations
npm run seed

# Or clear existing data and reseed
npm run seed --clear
```

**Expected output:**
```
🌱 Starting conversation seeding...
📝 Generating 30 conversations...
✅ Seeding completed successfully!
📊 Inserted 30 conversations
📊 Database Statistics:
   Total conversations: 30
   Unique customers: 15
   Unique queues: 8
   Avg articles per conversation: 2.8
```

### Step 6: Start the Application

```bash
# Start the server
npm run dev

# Or for production
npm start
```

**Expected output:**
```
🚀 Conversation AI Backend running on port 3002
📊 Health check: http://localhost:3002/health
💬 Single chat endpoint: http://localhost:3002/chat

🤖 AI Models:
   Conversation: gemma:2b
   Summarization: mistral:7b
   Query Generation: deepseek-coder:6.7b
```

## 🧪 Testing the Application

### 1. Health Check
```bash
curl http://localhost:3002/health
```

### 2. General Conversation
```bash
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What kind of conversations do you have access to?"}'
```

### 3. Find Specific Conversation
```bash
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me open tickets"}'
```

### 4. Summarization Request
```bash
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Summarize ticket 2025010610000001"}'
```

### 5. Vague Query (Tests Clarification)
```bash
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What did he say?"}'
```

## 📁 Project Structure

```
conversation-ai-backend/
├── src/
│   ├── agents/
│   │   ├── conversationAgent.js    # Main orchestrator
│   │   ├── clarificationAgent.js   # Handles vague queries
│   │   ├── queryAgent.js           # MongoDB query generation
│   │   └── summarizationAgent.js   # Conversation summaries
│   ├── db/
│   │   └── mongodb.js              # Database connection & utils
│   ├── utils/
│   │   ├── helpers.js              # Utility functions
│   │   └── mongoPresetQueries.js   # Common query patterns
│   └── index.js                    # Express server
├── prompts/
│   ├── conversationAnalysis.md     # General conversation prompts
│   ├── clarification.md            # Clarification request prompts
│   ├── mongoQueryGeneration.md     # Query generation prompts
│   └── summarization.md            # Summarization prompts
├── data/
│   └── seed.js                     # Database seeding script
├── docker-compose.yml              # MongoDB container
├── package.json
├── .env                           # Environment configuration
└── README.md
```

## 🔧 Configuration Options

### Changing AI Models

Update `.env` file to use different Ollama models:

```env
# Lightweight setup
CONVERSATION_MODEL=gemma:2b
SUMMARIZATION_MODEL=gemma:2b  
QUERY_MODEL=deepseek-coder:1.3b

# High-performance setup  
CONVERSATION_MODEL=llama2:13b
SUMMARIZATION_MODEL=mistral:7b
QUERY_MODEL=deepseek-coder:6.7b

# Experimental setup
CONVERSATION_MODEL=phi:latest
SUMMARIZATION_MODEL=qwen:7b
QUERY_MODEL=codellama:7b
```

**Remember to pull new models:**
```bash
ollama pull llama2:13b
ollama pull qwen:7b
# etc.
```

### Database Configuration

For external MongoDB:
```env
MONGODB_URI=mongodb://user:pass@your-mongo-host:27017/conversations
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/conversations
```

## 🐛 Troubleshooting

### Issue: "model not found" Error
**Problem:** Ollama models not downloaded
**Solution:**
```bash
ollama pull gemma:2b
ollama pull mistral:7b
ollama pull deepseek-coder:6.7b
```

### Issue: MongoDB Connection Failed
**Problem:** Database not running or wrong credentials
**Solution:**
```bash
# Check if MongoDB container is running
docker-compose ps

# Restart if needed
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs mongodb
```

### Issue: Ollama Connection Failed
**Problem:** Ollama service not running
**Solution:**
```bash
# Start Ollama service
ollama serve

# In another terminal, test
ollama list
```

### Issue: Port Already in Use
**Problem:** Port 3002 is occupied
**Solution:**
```bash
# Change port in .env
PORT=3003

# Or find and stop the process using port 3002
lsof -ti:3002 | xargs kill -9
```

### Issue: Slow AI Responses
**Problem:** Large models or limited resources
**Solutions:**
1. Use smaller models:
   ```env
   CONVERSATION_MODEL=gemma:2b
   SUMMARIZATION_MODEL=gemma:2b
   QUERY_MODEL=deepseek-coder:1.3b
   ```

2. Increase timeout in agents (if needed)

3. Check system resources:
   ```bash
   # Monitor CPU/Memory usage
   top
   # Or on macOS
   Activity Monitor
   ```

## 📝 Usage Examples

### General Database Questions
- "What conversations do you have?"
- "Tell me about the database"
- "What kind of support tickets are stored here?"

### Specific Lookups
- "Find ticket 2025010610000001"
- "Show conversations from john@company.com"  
- "Get open tickets from yesterday"

### Summarization
- "Summarize ticket 2025010610000001"
- "Give me a summary of the conversation with jane@company.com"

### Search & Filter
- "Find technical support tickets"
- "Show me high priority conversations"
- "List pending tickets from this week"

### Analytics
- "How many conversations are open?"
- "Show me tickets by queue"
- "What's the average resolution time?"

## 🔄 Model Swapping Guide

To experiment with different AI models:

1. **Find available models:**
   ```bash
   ollama list --remote | grep -E "(gemma|mistral|llama|codellama|deepseek)"
   ```

2. **Pull new model:**
   ```bash
   ollama pull llama2:7b
   ```

3. **Update .env:**
   ```env
   CONVERSATION_MODEL=llama2:7b
   ```

4. **Restart server:**
   ```bash
   npm run dev
   ```

5. **Test performance** with sample queries

## 📊 Performance Tips

- **Small models** (gemma:2b): Fast responses, good for development
- **Medium models** (mistral:7b): Balanced performance and quality  
- **Large models** (llama2:13b): Best quality, slower responses
- **Specialized models** (deepseek-coder): Best for specific tasks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Submit a pull request

## 📄 License

[Add your license information here]

---

## Quick Start Checklist

- [ ] Node.js installed
- [ ] Docker installed  
- [ ] Ollama installed and running (`ollama serve`)
- [ ] AI models downloaded (`ollama pull gemma:2b mistral:7b deepseek-coder:6.7b`)
- [ ] MongoDB started (`docker-compose up -d`)
- [ ] Environment configured (`.env` file created)
- [ ] Dependencies installed (`npm install`)
- [ ] Database seeded (`npm run seed`)
- [ ] Server started (`npm run dev`)
- [ ] Health check passed (`curl http://localhost:3002/health`)

🎉 **You're ready to start conversing with your AI about customer support data!**