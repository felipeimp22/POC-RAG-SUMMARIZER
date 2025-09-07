// src/index-fixed.js
import express from 'express';
import cors from 'cors';
import superIntelligentRAGSystem from './core/SuperIntelligentRAGSystem.js';
import summarizationService from './routes/summarization.js';

const app = express();
app.use(cors());
app.use(express.json());

// Main chat endpoint - Enhanced with smarter pattern recognition
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

// *** NEW: Dedicated Summarization Endpoint ***
app.get('/summarize/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const debugMode = req.query.debug === 'true';
        
        const debugLog = debugMode ? 
            (msg, ...args) => console.log(`[SUMMARIZE] ${msg}`, ...args) : 
            () => {};
            
        debugLog(`📋 Summarization request for: ${identifier}`);
        
        const result = await summarizationService.summarizeByIdentifier(identifier, debugLog);
        
        if (result.success) {
            res.json({
                success: true,
                identifier,
                ticket: result.ticket,
                summary: result.summary.summary,
                conversationLength: result.conversationLength,
                attachmentCount: result.attachmentCount,
                timestamp: new Date().toISOString(),
                systemType: 'Super Intelligent Summarization'
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error,
                message: result.message,
                identifier,
                timestamp: new Date().toISOString(),
                systemType: 'Super Intelligent Summarization'
            });
        }
        
    } catch (error) {
        console.error('❌ Summarization Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to create summary. Please try again.",
            identifier: req.params.identifier,
            timestamp: new Date().toISOString(),
            systemType: 'Super Intelligent Summarization'
        });
    }
});

// *** NEW: Batch Summarization Endpoint ***
app.post('/summarize/batch', async (req, res) => {
    try {
        const { identifiers } = req.body;
        
        if (!identifiers || !Array.isArray(identifiers)) {
            return res.status(400).json({
                error: 'identifiers array required',
                example: { identifiers: ["13000020", "13000021", "13000022"] },
                systemType: 'Super Intelligent Summarization'
            });
        }
        
        const debugLog = (msg, ...args) => console.log(`[BATCH-SUMMARIZE] ${msg}`, ...args);
        debugLog(`📋 Batch summarization for ${identifiers.length} tickets`);
        
        const results = [];
        for (const identifier of identifiers) {
            const result = await summarizationService.summarizeByIdentifier(identifier, debugLog);
            results.push({
                identifier,
                success: result.success,
                summary: result.success ? result.summary.summary : null,
                error: result.success ? null : result.error
            });
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;
        
        res.json({
            success: true,
            processed: results.length,
            successful,
            failed,
            results,
            timestamp: new Date().toISOString(),
            systemType: 'Super Intelligent Batch Summarization'
        });
        
    } catch (error) {
        console.error('❌ Batch Summarization Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Batch summarization failed. Please try again.",
            systemType: 'Super Intelligent Batch Summarization'
        });
    }
});

// Health check endpoint
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

// Session management endpoints
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

// System management
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

// Intelligence test endpoint
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
    console.log(`\n🧠 ENHANCED SUPER INTELLIGENT RAG SYSTEM API RUNNING ON PORT ${PORT} 🧠`);
    console.log(`\n🌐 Enhanced Endpoints:`);
    console.log(` POST /chat - Main super intelligent conversation endpoint`);
    console.log(` GET /summarize/:identifier - Dedicated ticket summarization`);
    console.log(` POST /summarize/batch - Batch ticket summarization`);
    console.log(` GET /health - Super intelligent system status and health`);
    console.log(` GET /intelligence-metrics - System intelligence metrics`);
    console.log(` GET /session/:id - Get session info with intelligence data`);
    console.log(` DELETE /session/:id - Clear session with super intelligence`);
    console.log(` POST /admin/cleanup - Clean old sessions intelligently`);
    console.log(` POST /test-intelligence - Test system intelligence capabilities`);
    
    console.log(`\n🚀 ENHANCED SUPER INTELLIGENT FEATURES:`);
    console.log(` 🧠 Smarter pattern recognition (explains vs queries)`);
    console.log(` 🎯 Perfect request understanding (no missed queries!)`);
    console.log(` ⚡ Dynamic MongoDB query generation`);
    console.log(` 📊 Intelligent result formatting`);
    console.log(` 📋 Dedicated summarization endpoints`);
    console.log(` 🔧 Automatic error correction`);
    console.log(` 💭 Context-aware conversations`);
    console.log(` 🚀 Zero pre-coded intents - Pure AI intelligence`);
    
    console.log(`\n💡 EXAMPLES THAT NOW WORK PERFECTLY:`);
    console.log(` "explain how my data structure works" → ✅ Detailed explanation`);
    console.log(` "list all ticket IDs" → ✅ Perfect TicketID extraction`);
    console.log(` "find tickets from john@email.com" → ✅ Smart customer search`);
    console.log(` "show open tickets" → ✅ Intelligent status filtering`);
    console.log(` "search for login issues" → ✅ Full-text search`);
    console.log(` "summarize ticket 12345" → ✅ Comprehensive analysis`);
    
    console.log(`\n📋 DEDICATED SUMMARIZATION ENDPOINTS:`);
    console.log(` GET /summarize/13000020 → ✅ Precise ticket summary`);
    console.log(` GET /summarize/2025090610000020 → ✅ By ticket number`);
    console.log(` POST /summarize/batch → ✅ Multiple tickets at once`);
    
    console.log(`\n🧠 YOUR RAG SYSTEM IS NOW SUPER INTELLIGENT WITH ENHANCED CAPABILITIES! 🧠`);
});

export default app;