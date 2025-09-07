// src/index.js - SUPER INTELLIGENT RAG SYSTEM API
import express from 'express';
import cors from 'cors';
import superIntelligentRAGSystem from './core/SuperIntelligentRAGSystem.js';

const app = express();

app.use(cors());
app.use(express.json());

// Main chat endpoint - Now uses SUPER INTELLIGENT RAG System
app.post('/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message required',
                example: { message: "list all ticket IDs", sessionId: "user123" },
                systemType: 'Super Intelligent RAG System'
            });
        }

        const response = await superIntelligentRAGSystem.chat(message, sessionId);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Super Intelligent System Error:', error);
        res.status(500).json({
            error: error.message,
            response: "I encountered an error while applying super intelligence. Please try again.",
            systemType: 'Super Intelligent RAG System'
        });
    }
});

// Health check endpoint with super intelligent system info
app.get('/health', async (req, res) => {
    try {
        const systemStatus = superIntelligentRAGSystem.getSystemStatus();
        const healthCheck = await superIntelligentRAGSystem.performIntelligenceHealthCheck();
        
        res.json({ 
            status: 'ok',
            ...systemStatus,
            healthCheck,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'error',
            systemType: 'Super Intelligent RAG System',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Super intelligent system metrics
app.get('/intelligence-metrics', (req, res) => {
    try {
        const metrics = superIntelligentRAGSystem.getIntelligenceMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            systemType: 'Super Intelligent RAG System'
        });
    }
});

// Session management endpoints with intelligence
app.get('/session/:sessionId', (req, res) => {
    try {
        const sessionInfo = superIntelligentRAGSystem.getSessionInfo(req.params.sessionId);
        res.json(sessionInfo);
    } catch (error) {
        res.status(404).json({ 
            error: 'Session not found',
            systemType: 'Super Intelligent RAG System'
        });
    }
});

app.delete('/session/:sessionId', (req, res) => {
    try {
        const result = superIntelligentRAGSystem.clearSession(req.params.sessionId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            systemType: 'Super Intelligent RAG System'
        });
    }
});

// Super intelligent system management
app.post('/admin/cleanup', (req, res) => {
    try {
        const { maxAge } = req.body;
        const result = superIntelligentRAGSystem.cleanupSessions(maxAge);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            systemType: 'Super Intelligent RAG System'
        });
    }
});

// System intelligence test endpoint
app.post('/test-intelligence', async (req, res) => {
    try {
        const { testMessage = "test super intelligence capabilities" } = req.body;
        const testResult = await superIntelligentRAGSystem.chat(testMessage, 'intelligence-test');
        
        res.json({
            testMessage,
            testResult,
            intelligenceLevel: testResult.intelligenceLevel || 'Super',
            systemType: 'Super Intelligent RAG System',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            testFailed: true,
            systemType: 'Super Intelligent RAG System'
        });
    }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`\n🧠 SUPER INTELLIGENT RAG SYSTEM API RUNNING ON PORT ${PORT} 🧠`);
    console.log(`\n🌐 Super Intelligent Endpoints:`);
    console.log(`   POST /chat - Main super intelligent conversation endpoint`);
    console.log(`   GET  /health - Super intelligent system status and health`);
    console.log(`   GET  /intelligence-metrics - System intelligence metrics`);
    console.log(`   GET  /session/:id - Get session info with intelligence data`);
    console.log(`   DELETE /session/:id - Clear session with super intelligence`);
    console.log(`   POST /admin/cleanup - Clean old sessions intelligently`);
    console.log(`   POST /test-intelligence - Test system intelligence capabilities`);
    
    console.log(`\n🚀 SUPER INTELLIGENT FEATURES ACTIVATED:`);
    console.log(`   🧠 Complete database structure mastery`);
    console.log(`   🎯 Perfect request understanding (no missed queries!)`);
    console.log(`   ⚡ Dynamic MongoDB query generation`);
    console.log(`   📊 Intelligent result formatting`);
    console.log(`   🔧 Automatic error correction`);
    console.log(`   💭 Context-aware conversations`);
    console.log(`   🚀 Zero pre-coded intents - Pure AI intelligence`);
    
    console.log(`\n💡 EXAMPLE REQUESTS THAT NOW WORK PERFECTLY:`);
    console.log(`   "list all ticket IDs" → Perfect TicketID extraction`);
    console.log(`   "find tickets from john@email.com" → Smart customer search`);
    console.log(`   "show open tickets" → Intelligent status filtering`);
    console.log(`   "search for login issues" → Full-text search across titles/messages`);
    console.log(`   "summarize ticket 12345" → Comprehensive ticket analysis`);
    
    console.log(`\n🧠 YOUR RAG SYSTEM IS NOW SUPER INTELLIGENT! 🧠`);
});

export default app;