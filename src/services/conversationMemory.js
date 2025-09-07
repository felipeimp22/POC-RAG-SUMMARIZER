// src/services/conversationMemory.js - In-memory conversation context manager
class ConversationMemory {
    constructor() {
        // Store conversation contexts by session ID
        this.conversations = new Map();
        this.maxHistoryLength = 10; // Keep last 10 interactions
        
        // Clean up old conversations every hour
        setInterval(() => this.cleanup(), 3600000);
    }

    // Get or create a conversation context
    getContext(sessionId) {
        if (!this.conversations.has(sessionId)) {
            this.conversations.set(sessionId, {
                history: [],
                context: {},
                lastActivity: Date.now(),
                clarificationState: null
            });
        }
        
        const conv = this.conversations.get(sessionId);
        conv.lastActivity = Date.now();
        return conv;
    }

    // Add interaction to history
    addInteraction(sessionId, interaction) {
        const context = this.getContext(sessionId);
        
        context.history.push({
            timestamp: new Date(),
            userMessage: interaction.userMessage,
            intent: interaction.intent,
            response: interaction.response,
            queryExecuted: interaction.queryExecuted,
            resultsFound: interaction.resultsFound
        });
        
        // Keep only last N interactions
        if (context.history.length > this.maxHistoryLength) {
            context.history.shift();
        }
        
        // Update context based on interaction
        this.updateContext(context, interaction);
    }

    updateContext(context, interaction) {
        // Track frequently accessed entities
        if (interaction.intent?.filters?.customer) {
            context.context.lastCustomer = interaction.intent.filters.customer;
        }
        if (interaction.intent?.filters?.ticketNumber) {
            context.context.lastTicketNumber = interaction.intent.filters.ticketNumber;
        }
        if (interaction.intent?.filters?.queue) {
            context.context.lastQueue = interaction.intent.filters.queue;
        }
        
        // Track search patterns
        if (!context.context.searchPatterns) {
            context.context.searchPatterns = [];
        }
        if (interaction.intent?.action) {
            context.context.searchPatterns.push(interaction.intent.action);
            // Keep only last 5 patterns
            if (context.context.searchPatterns.length > 5) {
                context.context.searchPatterns.shift();
            }
        }
    }

    // Set clarification state
    setClarificationState(sessionId, state) {
        const context = this.getContext(sessionId);
        context.clarificationState = state;
    }

    // Get clarification state
    getClarificationState(sessionId) {
        const context = this.getContext(sessionId);
        return context.clarificationState;
    }

    // Clear clarification state
    clearClarificationState(sessionId) {
        const context = this.getContext(sessionId);
        context.clarificationState = null;
    }

    // Get conversation summary for AI context
    getConversationSummary(sessionId) {
        const context = this.getContext(sessionId);
        
        if (context.history.length === 0) {
            return null;
        }
        
        const recentHistory = context.history.slice(-3); // Last 3 interactions
        
        return {
            recentInteractions: recentHistory.map(h => ({
                user: h.userMessage,
                action: h.intent?.action,
                found: h.resultsFound
            })),
            context: context.context,
            clarificationPending: context.clarificationState !== null
        };
    }

    // Clean up old conversations (inactive for > 2 hours)
    cleanup() {
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        
        for (const [sessionId, conv] of this.conversations.entries()) {
            if (conv.lastActivity < twoHoursAgo) {
                this.conversations.delete(sessionId);
            }
        }
    }

    // Clear all memory (for server restart)
    clear() {
        this.conversations.clear();
    }
}

// Singleton instance
const conversationMemory = new ConversationMemory();
export default conversationMemory;