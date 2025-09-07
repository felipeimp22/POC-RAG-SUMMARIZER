// src/ai/SuperIntelligentConversationalAI.js - WORKING CONVERSATION HANDLER
import { ChatOllama } from "@langchain/ollama";

class SuperIntelligentConversationalAI {
    constructor() {
        this.model = new ChatOllama({
            temperature: 0.3,
            model: process.env.CONVERSATION_MODEL || 'llama2:7b',
            baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
        console.log('🗣️ SuperIntelligent ConversationalAI initialized');
    }

    async analyzeUserRequest(message, conversationContext, debugLog = () => {}) {
        debugLog("🧠 Analyzing user request with intelligence");
        
        // Use pattern detection for reliable analysis
        const patterns = this.detectObviousPatterns(message);
        if (patterns) {
            debugLog(`🎯 Pattern detected: ${patterns.action}`);
            return patterns;
        }
        
        // Fallback analysis
        debugLog("🔄 Using fallback analysis");
        return this.intelligentFallback(message);
    }

    detectObviousPatterns(message) {
        const lowerMessage = message.toLowerCase();
        
        // Data request patterns
        const dataRequestPatterns = [
            /\b(list|show|get|find|search|display)\b.*\b(all|ticket|id|customer|email)\b/,
            /\ball\b.*\b(ticket|id|customer)\b/,
            /\bticket.*\b(id|number|list)\b/,
            /\bhow many\b.*\b(ticket|customer)\b/,
            /\bcan you.*\b(list|show|find)\b/
        ];
        
        if (dataRequestPatterns.some(pattern => pattern.test(lowerMessage))) {
            return {
                action: "query",
                reasoning: "Obvious data request detected",
                needsData: true,
                queryInstruction: this.generateQueryInstruction(lowerMessage),
                confidence: 0.95
            };
        }
        
        // Greeting patterns
        if (/^(hi|hello|hey)$/i.test(lowerMessage.trim())) {
            return {
                action: "chat",
                reasoning: "Simple greeting detected",
                needsData: false,
                conversationResponse: "Hello! I'm your super intelligent ticket database assistant. I can help you find tickets, search by customer, analyze data, or explain the system. What would you like to do?",
                confidence: 0.95
            };
        }
        
        // Summarization patterns
        if (/\b(summarize|summary)\b.*\b(ticket|conversation)\b/i.test(lowerMessage)) {
            return {
                action: "summarize",
                reasoning: "Summarization request detected",
                needsData: true,
                summaryInstruction: `Summarize based on request: ${message}`,
                confidence: 0.9
            };
        }
        
        return null; // No obvious pattern
    }

    generateQueryInstruction(lowerMessage) {
        if (/ticket.*id|list.*ticket.*id|all.*ticket.*id/i.test(lowerMessage)) {
            return "Get all tickets and return only their TicketID values";
        } else if (/customer|email/i.test(lowerMessage)) {
            return "Get all unique customer emails from tickets";
        } else if (/open.*ticket/i.test(lowerMessage)) {
            return "Find all open tickets";
        } else if (/closed.*ticket/i.test(lowerMessage)) {
            return "Find all closed tickets";
        } else {
            return "Get all tickets with basic information";
        }
    }

    intelligentFallback(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for data-related keywords
        if (/\b(list|show|find|get|search|display|all|tickets?|data|database)\b/.test(lowerMessage)) {
            return {
                action: "query",
                reasoning: "Fallback detected data-related keywords",
                needsData: true,
                queryInstruction: "Get all tickets with basic information",
                confidence: 0.7
            };
        }
        
        // Check for explanation keywords
        if (/\b(what|how|explain|help|can|capability)\b/.test(lowerMessage)) {
            return {
                action: "explain",
                reasoning: "Fallback detected explanation request",
                needsData: false,
                conversationResponse: this.generateCapabilityExplanation(),
                confidence: 0.7
            };
        }
        
        // Default to conversation
        return {
            action: "chat",
            reasoning: "Fallback default to conversation",
            needsData: false,
            conversationResponse: "I'm your super intelligent ticket database assistant. I can help you find tickets, search by customer, analyze data, or explain the system. What would you like to do?",
            confidence: 0.5
        };
    }

    generateCapabilityExplanation() {
        return `🤖 **I'm your Super Intelligent Ticket Database Assistant!**

I can help you with:

🔍 **Data Queries**:
• "list all ticket IDs" - Get every ticket identifier
• "find tickets from john@email.com" - Search by customer
• "show open tickets" - Filter by status
• "search for login issues" - Full-text search
• "how many tickets" - Count queries

📊 **Database Knowledge**:
• **Tickets**: ID, Number, Title, Customer, Status, Priority, Queue, Dates
• **Messages**: Full conversation history with content and senders
• **Attachments**: Files attached to messages

📋 **Summarization**:
• "summarize ticket 12345" - Detailed ticket analysis

Just ask me naturally! I understand database requests with super intelligence.`;
    }

    async generateFinalResponse(userMessage, processingResults, conversationContext, debugLog = () => {}) {
        debugLog("🗣️ Generating final response");
        
        try {
            if (processingResults.data?.type === 'query_results') {
                return processingResults.data.response || `I found ${processingResults.data.resultCount} results.`;
            } else if (processingResults.data?.type === 'conversation') {
                return processingResults.data.response;
            } else if (processingResults.data?.type === 'summary') {
                return processingResults.data.response;
            } else if (processingResults.data?.type === 'error') {
                return processingResults.data.response;
            } else {
                return "I processed your request successfully. Let me know if you need anything else!";
            }
        } catch (error) {
            debugLog("❌ Response generation error:", error);
            return "I processed your request but had trouble generating the final response. Please let me know what else you need!";
        }
    }

    async detectAndCorrectErrors(errorContext, debugLog = () => {}) {
        debugLog("🔧 Error detection and correction");
        
        const error = errorContext.error || '';
        
        if (error.includes('projection') || error.includes('field')) {
            return {
                errorType: "query_error",
                correctionNeeded: true,
                correctionInstructions: "Remove projection and use simple query",
                retryWithAI: "DatabaseQueryAI",
                explanation: "Projection error detected"
            };
        }
        
        return { 
            errorType: "unknown", 
            correctionNeeded: true,
            correctionInstructions: "Retry with simpler approach",
            retryWithAI: "DatabaseQueryAI"
        };
    }
}

export default SuperIntelligentConversationalAI;