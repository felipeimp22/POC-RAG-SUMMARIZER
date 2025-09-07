// src/core/SuperIntelligentRAGSystem.js - SUPER INTELLIGENT RAG SYSTEM
import SuperIntelligentCoordinator from './SuperIntelligentCoordinator.js';

class SuperIntelligentRAGSystem {
    constructor() {
        this.coordinator = new SuperIntelligentCoordinator();
        this.sessions = new Map(); // Track active sessions
        this.debugMode = process.env.DEBUG_ENABLED === 'true';
        
        console.log('🧠 SUPER INTELLIGENT RAG SYSTEM INITIALIZED 🧠');
        console.log('🤖 Three Super Intelligent AIs loaded:');
        console.log('   - SuperIntelligent ConversationalAI (llama2:7b) - Master Decision Maker');
        console.log('   - SuperIntelligent DatabaseQueryAI (deepseek-coder:6.7b) - MongoDB Expert');
        console.log('   - SuperIntelligent FormatterSummarizerAI (mistral:7b) - Response Expert');
        console.log('💡 100% DYNAMIC - NO PRE-CODED INTENTS - PURE AI INTELLIGENCE');
        console.log('🚀 Can handle ANY database request with super intelligence!');
    }

    async chat(message, sessionId = 'default') {
        // Create debug logger with intelligence
        const debugLog = this.debugMode ? 
            (msg, ...args) => console.log(`[SI-${sessionId}] ${msg}`, ...args) : 
            () => {};

        debugLog(`\n🗣️ User Request: "${message}"`);
        debugLog('🧠 Applying Super Intelligence...');
        
        try {
            // Track session with intelligence
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, {
                    createdAt: new Date(),
                    messageCount: 0,
                    lastActivity: new Date(),
                    intelligenceLevel: 'Super'
                });
            }
            
            const session = this.sessions.get(sessionId);
            session.messageCount++;
            session.lastActivity = new Date();
            session.intelligenceLevel = 'Super';
            
            // Process through super intelligent coordinator
            const result = await this.coordinator.processUserMessage(
                message, 
                sessionId, 
                debugLog
            );
            
            debugLog(`✅ Super Intelligence applied successfully!`);
            debugLog(`📊 Response: ${result.response?.substring(0, 100)}...`);
            debugLog(`🎯 Results: ${result.resultCount} items found`);
            debugLog(`⚡ Processing: ${result.processingTime}ms`);
            
            return result;
            
        } catch (error) {
            debugLog(`❌ Super Intelligence error:`, error);
            
            return {
                response: `I encountered an unexpected error while applying super intelligence to your message: "${message}". My intelligence systems are adapting. Please try again or rephrase your request.`,
                sessionId,
                error: error.message,
                success: false,
                intelligenceLevel: 'Super'
            };
        }
    }

    // Get session information with intelligence metrics
    getSessionInfo(sessionId) {
        const sessionData = this.sessions.get(sessionId);
        const coordinatorStatus = this.coordinator.getSessionStatus(sessionId);
        
        return {
            ...sessionData,
            ...coordinatorStatus,
            systemStatus: 'Super Intelligent',
            aiModels: {
                conversational: {
                    model: process.env.CONVERSATION_MODEL || 'llama2:7b',
                    intelligence: 'Super',
                    role: 'Master Decision Maker & Natural Conversation'
                },
                database: {
                    model: process.env.QUERY_MODEL || 'deepseek-coder:6.7b', 
                    intelligence: 'Super',
                    role: 'MongoDB Expert & Perfect Query Builder'
                },
                formatter: {
                    model: process.env.SUMMARIZATION_MODEL || 'mistral:7b',
                    intelligence: 'Super',
                    role: 'Response Expert & Intelligent Summarization'
                }
            }
        };
    }

    // Clear specific session
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
        this.coordinator.clearSession(sessionId);
        return { 
            success: true, 
            message: `Super Intelligent Session ${sessionId} cleared`,
            intelligenceLevel: 'Super'
        };
    }

    // Get super intelligent system status
    getSystemStatus() {
        return {
            systemType: 'Super Intelligent RAG System',
            intelligenceLevel: 'Super',
            activeSessions: this.sessions.size,
            aiModels: {
                conversational: {
                    model: process.env.CONVERSATION_MODEL || 'llama2:7b',
                    intelligence: 'Super',
                    role: 'Master decision making, natural conversation, intelligent error correction',
                    capabilities: [
                        'Perfect request analysis',
                        'Dynamic decision making',
                        'Context-aware responses',
                        'Intelligent error detection',
                        'Natural conversation flow'
                    ]
                },
                database: {
                    model: process.env.QUERY_MODEL || 'deepseek-coder:6.7b',
                    intelligence: 'Super', 
                    role: 'MongoDB mastery, perfect query generation, database expertise',
                    capabilities: [
                        'Perfect MongoDB query generation',
                        'Complete database structure knowledge',
                        'Query optimization and correction',
                        'Performance analysis',
                        'Intelligent fallback strategies'
                    ]
                },
                formatter: {
                    model: process.env.SUMMARIZATION_MODEL || 'mistral:7b',
                    intelligence: 'Super',
                    role: 'Response formatting, intelligent summarization, dynamic presentation',
                    capabilities: [
                        'Dynamic response formatting',
                        'Intelligent summarization',
                        'Context-aware presentation',
                        'Format error correction',
                        'User-expectation matching'
                    ]
                }
            },
            superIntelligentFeatures: [
                '🧠 Complete database structure mastery',
                '🎯 Perfect request understanding',
                '⚡ Dynamic query generation',
                '📊 Intelligent result formatting',
                '🔧 Auto error correction',
                '💭 Context-aware conversations',
                '🚀 Zero pre-coded intents',
                '🎨 Dynamic response adaptation',
                '📈 Performance optimization',
                '🔍 Complex query handling'
            ],
            databaseCapabilities: {
                searchableFields: 'All ticket, message, and attachment fields',
                queryTypes: [
                    'Simple data retrieval',
                    'Complex filtered searches', 
                    'Text search across messages',
                    'Customer-based queries',
                    'Status and priority filtering',
                    'Date-based searches',
                    'Statistical analysis',
                    'Cross-field correlations'
                ],
                intelligentFeatures: [
                    'Auto-detection of data request types',
                    'Perfect field path resolution', 
                    'Optimal query structure',
                    'Performance-optimized execution',
                    'Fallback strategies for errors',
                    'Result count optimization'
                ]
            },
            debugMode: this.debugMode
        };
    }

    // Clean up old sessions with intelligence
    cleanupSessions(maxAge = 2 * 60 * 60 * 1000) { // 2 hours default
        const now = Date.now();
        let cleaned = 0;
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActivity.getTime() > maxAge) {
                this.clearSession(sessionId);
                cleaned++;
            }
        }
        
        return { 
            cleaned, 
            remaining: this.sessions.size,
            intelligenceLevel: 'Super',
            message: `Super Intelligence cleaned ${cleaned} old sessions`
        };
    }

    // Super intelligent system health check
    async performIntelligenceHealthCheck() {
        const healthCheck = {
            timestamp: new Date().toISOString(),
            systemType: 'Super Intelligent RAG System',
            status: 'healthy',
            intelligenceLevel: 'Super',
            checks: {}
        };

        try {
            // Test ConversationalAI intelligence
            const testDecision = await this.coordinator.conversationalAI.analyzeUserRequest(
                'test system intelligence',
                { history: [], context: {} }
            );
            
            healthCheck.checks.conversationalAI = {
                status: testDecision ? 'healthy' : 'degraded',
                intelligence: 'Super',
                lastResponse: testDecision?.action || 'unknown'
            };

        } catch (error) {
            healthCheck.checks.conversationalAI = {
                status: 'error',
                intelligence: 'Degraded',
                error: error.message
            };
        }

        try {
            // Test Database connection
            await require('../db/mongodb.js').default.connect();
            healthCheck.checks.database = {
                status: 'healthy',
                intelligence: 'Super',
                connection: 'active'
            };

        } catch (error) {
            healthCheck.checks.database = {
                status: 'error',
                intelligence: 'Degraded', 
                error: error.message
            };
            healthCheck.status = 'degraded';
        }

        // Overall intelligence assessment
        const healthyChecks = Object.values(healthCheck.checks).filter(c => c.status === 'healthy').length;
        const totalChecks = Object.keys(healthCheck.checks).length;
        
        if (healthyChecks === totalChecks) {
            healthCheck.overallIntelligence = 'Super';
            healthCheck.status = 'healthy';
        } else if (healthyChecks > 0) {
            healthCheck.overallIntelligence = 'Degraded';
            healthCheck.status = 'degraded';
        } else {
            healthCheck.overallIntelligence = 'Critical';
            healthCheck.status = 'critical';
        }

        return healthCheck;
    }

    // Get super intelligent system metrics
    getIntelligenceMetrics() {
        const sessions = Array.from(this.sessions.values());
        const totalMessages = sessions.reduce((sum, session) => sum + session.messageCount, 0);
        const avgMessagesPerSession = sessions.length > 0 ? totalMessages / sessions.length : 0;

        return {
            systemType: 'Super Intelligent RAG System',
            intelligenceLevel: 'Super',
            metrics: {
                totalSessions: sessions.length,
                totalMessages: totalMessages,
                averageMessagesPerSession: Math.round(avgMessagesPerSession * 100) / 100,
                oldestSession: sessions.length > 0 ? 
                    Math.min(...sessions.map(s => s.createdAt.getTime())) : null,
                newestSession: sessions.length > 0 ? 
                    Math.max(...sessions.map(s => s.createdAt.getTime())) : null,
                mostActiveSession: sessions.reduce((max, session) => 
                    session.messageCount > (max?.messageCount || 0) ? session : max, null)?.messageCount || 0
            },
            capabilities: {
                naturalLanguageProcessing: 'Super',
                databaseQuerying: 'Super', 
                responseFormatting: 'Super',
                errorCorrection: 'Super',
                contextAwareness: 'Super',
                dynamicAdaptation: 'Super'
            }
        };
    }
}

// Export singleton instance
const superIntelligentRAGSystem = new SuperIntelligentRAGSystem();
export default superIntelligentRAGSystem;