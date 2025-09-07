// src/index.js - SIMPLIFIED INTELLIGENT API
import express from 'express';
import cors from 'cors';
import orchestrator from './core/AIOrchestrator.js';

const app = express();

app.use(cors());
app.use(express.json());

// Single intelligent endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }

        console.log(`📨 [${sessionId}] User: ${message}`);
        
        const response = await orchestrator.processConversation(
            message, 
            sessionId,
            (...args) => console.log(...args)
        );
        
        console.log(`🤖 [${sessionId}] Bot: ${response.response?.substring(0, 100)}...`);
        
        res.json(response);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            error: error.message,
            response: "I encountered an error. Please try again."
        });
    }
});

// Memory management endpoints
app.delete('/chat/memory/:sessionId', (req, res) => {
    orchestrator.clearMemory(req.params.sessionId);
    res.json({ message: 'Memory cleared' });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        sessions: orchestrator.memory.size
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Intelligent RAG System running on port ${PORT}`);
    console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/chat`);
    console.log(`🧠 Using dynamic AI orchestration`);
});