// src/core/DynamicRAGSystem.js - NEW Main System - Replace TrueAISystem.js
import IntelligentCoordinator from './IntelligentCoordinator.js';

class DynamicRAGSystem {
    constructor() {
        this.coordinator = new IntelligentCoordinator();
        this.sessions = new Map(); // Track active sessions
        this.debugMode = process.env.DEBUG_ENABLED === 'true';
        
        console.log('🚀 Dynamic RAG System initialized');
        console.log('🤖 Three specialized AIs loaded:');
        console.log('  - ConversationalAI (llama2:7b) - Natural conversation');
        console.log('  - DatabaseQueryAI (deepseek-coder:6.7b) - Intelligent queries');
        console.log('  - FormatterSummarizerAI (mistral:7b) - Smart formatting');
        console.log('💡 100% Dynamic - No pre-coded intents');
    }

    async chat(message, sessionId = 'default') {
        // Create debug logger
        const debugLog = this.debugMode ? 
            (msg, ...args) => console.log(`[${sessionId}] ${msg}`, ...args) : 
            () => {};

        debugLog(`\n🗣️ User: "${message}"`);
        
        try {
            // Track session
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, {
                    createdAt: new Date(),
                    messageCount: 0,
                    lastActivity: new Date()
                });
            }
            
            const session = this.sessions.get(sessionId);
            session.messageCount++;
            session.lastActivity = new Date();
            
            // Process through intelligent coordinator
            const result = await this.coordinator.processUserMessage(
                message, 
                sessionId, 
                debugLog
            );
            
            debugLog(`✅ Response generated: ${result.response?.substring(0, 100)}...`);
            
            return result;
            
        } catch (error) {
            debugLog(`❌ System error:`, error);
            
            return {
                response: `I encountered an unexpected error while processing your message: "${message}". Please try again or rephrase your request.`,
                sessionId,
                error: error.message,
                success: false
            };
        }
    }

    // Get session information
    getSessionInfo(sessionId) {
        const sessionData = this.sessions.get(sessionId);
        const coordinatorStatus = this.coordinator.getSessionStatus(sessionId);
        
        return {
            ...sessionData,
            ...coordinatorStatus,
            systemStatus: 'active',
            aiModels: {
                conversational: process.env.CONVERSATION_MODEL || 'llama2:7b',
                database: process.env.QUERY_MODEL || 'deepseek-coder:6.7b',
                formatter: process.env.SUMMARIZATION_MODEL || 'mistral:7b'
            }
        };
    }

    // Clear specific session
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
        this.coordinator.clearSession(sessionId);
        return { success: true, message: `Session ${sessionId} cleared` };
    }

    // Get system status
    getSystemStatus() {
        return {
            systemType: 'Dynamic RAG System',
            activeSessions: this.sessions.size,
            aiModels: {
                conversational: {
                    model: process.env.CONVERSATION_MODEL || 'llama2:7b',
                    role: 'Natural conversation, decision making, error correction'
                },
                database: {
                    model: process.env.QUERY_MODEL || 'deepseek-coder:6.7b',
                    role: 'MongoDB query generation, database expertise'
                },
                formatter: {
                    model: process.env.SUMMARIZATION_MODEL || 'mistral:7b',
                    role: 'Response formatting, intelligent summarization'
                }
            },
            features: [
                'Natural conversation flow',
                'Dynamic query generation',
                'Intelligent summarization',
                'Auto-correction between AIs',
                'Context-aware memory',
                'Zero pre-coded intents'
            ],
            debugMode: this.debugMode
        };
    }

    // Clean up old sessions (call periodically)
    cleanupSessions(maxAge = 2 * 60 * 60 * 1000) { // 2 hours default
        const now = Date.now();
        let cleaned = 0;
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActivity.getTime() > maxAge) {
                this.clearSession(sessionId);
                cleaned++;
            }
        }
        
        return { cleaned, remaining: this.sessions.size };
    }
}

// Export singleton instance
const dynamicRAGSystem = new DynamicRAGSystem();
export default dynamicRAGSystem;