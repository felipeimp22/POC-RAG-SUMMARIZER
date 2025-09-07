// src/services/clarificationService.js - FIXED: Only clarify when TRULY needed
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const clarificationModel = new ChatOllama({
    temperature: 0.3,
    maxRetries: 2,
    model: process.env.CONVERSATION_MODEL || 'gemma:2b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

class ClarificationService {
    async checkIfClarificationNeeded(userMessage, intent, context, debugLog) {
        debugLog("🤔 Checking if clarification needed...");
        
        // CRITICAL: Only clarify for TRULY ambiguous cases
        const NEVER_CLARIFY_PATTERNS = [
            /list|show|display|get|all|available|what.*have/i,
            /everything|any|total|count|how many/i,
            /access|can.*see|exist/i,
            /don't know|not sure|help/i
        ];
        
        // If user is asking for available options, NEVER clarify
        if (NEVER_CLARIFY_PATTERNS.some(pattern => pattern.test(userMessage))) {
            debugLog("✅ Clear request for listing - no clarification needed");
            return { needsClarification: false };
        }
        
        // Only clarify for pronouns WITHOUT context
        const CLARIFY_ONLY_IF = {
            pronouns: /\b(he|she|it|they|this|that)\b/i,
            vague_time: /\b(recently|earlier|before|later)\b/i,
            incomplete_ref: /\b(the ticket|the customer|the issue)\b/i
        };
        
        // Check if we have context that resolves the ambiguity
        let needsClarification = false;
        let reason = null;
        
        if (CLARIFY_ONLY_IF.pronouns.test(userMessage) && !context?.context?.lastTicketNumber) {
            needsClarification = true;
            reason = "pronouns_without_context";
        }
        
        if (CLARIFY_ONLY_IF.incomplete_ref.test(userMessage) && 
            !userMessage.match(/\d{10,}/) && // No ticket number
            !userMessage.match(/@/) && // No email
            !context?.context?.lastTicketNumber) {
            needsClarification = true;
            reason = "incomplete_reference";
        }
        
        // If intent already has filters, don't clarify
        if (intent?.filters && Object.keys(intent.filters).length > 0) {
            debugLog("✅ Intent has filters - proceeding without clarification");
            return { needsClarification: false };
        }
        
        if (!needsClarification) {
            return { needsClarification: false };
        }
        
        // Only return clarification for REAL ambiguity
        return {
            needsClarification: true,
            reason: reason,
            clarificationQuestion: this.generateSmartQuestion(userMessage, reason),
            confidence: 0.9 // Only clarify when very confident it's needed
        };
    }
    
    generateSmartQuestion(userMessage, reason) {
        const questions = {
            pronouns_without_context: "I need more context. Who or what are you referring to?",
            incomplete_reference: "Which specific ticket or customer are you asking about?",
            default: "Could you be more specific about what you're looking for?"
        };
        
        return questions[reason] || questions.default;
    }
    
    async generateClarificationResponse(clarificationInfo, recentResults = null) {
        // Simplified response - don't over-explain
        return {
            type: 'clarification',
            message: clarificationInfo.clarificationQuestion,
            suggestions: [
                "You can say 'show me all tickets' to see everything",
                "Or specify: 'tickets from john@email.com'",
                "Or: 'ticket 2025010610000001'"
            ]
        };
    }
    
    async handleClarificationResponse(userResponse, clarificationState, debugLog) {
        debugLog("📝 Processing clarification response...");
        
        // If user says they don't know or wants everything, return a list intent
        if (/don't know|all|everything|list|show/i.test(userResponse)) {
            return {
                action: "list",
                target: "tickets",
                filters: {},
                responseFormat: "list",
                needsSummarization: false,
                userExpectation: "Show all available tickets"
            };
        }
        
        // Otherwise, try to enhance the original intent
        const enhancedIntent = { ...clarificationState.originalIntent };
        
        // Extract any specific information from the response
        const ticketMatch = userResponse.match(/\d{10,}/);
        const emailMatch = userResponse.match(/[\w.-]+@[\w.-]+/);
        
        if (ticketMatch) {
            enhancedIntent.filters.ticketNumber = ticketMatch[0];
        }
        if (emailMatch) {
            enhancedIntent.filters.customer = emailMatch[0];
        }
        
        return enhancedIntent;
    }
}

const clarificationService = new ClarificationService();
export default clarificationService;