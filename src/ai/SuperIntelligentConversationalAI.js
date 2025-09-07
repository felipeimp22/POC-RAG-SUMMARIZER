// src/ai/SuperIntelligentConversationalAI-FIXED.js
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
        debugLog("🧠 Analyzing user request with enhanced intelligence and memory");
        
        // Use enhanced pattern detection with memory awareness
        const patterns = this.detectObviousPatterns(message, conversationContext, debugLog);
        if (patterns) {
            debugLog(`🎯 Pattern detected: ${patterns.action}`);
            return patterns;
        }
        
        // Fallback analysis with memory context
        debugLog("🔄 Using fallback analysis with memory context");
        return this.intelligentFallback(message, conversationContext, debugLog);
    }

    detectObviousPatterns(message, conversationContext, debugLog = () => {}) {
        const lowerMessage = message.toLowerCase();
        
        // *** PRIORITY 1: CONTINUATION REQUESTS (FIXED!) ***
        const continuationPatterns = [
            /\b(see more|show more|more|continue|next|show rest|show all|display more)\b/,
            /\b(show.*rest|display.*rest|get.*rest|list.*rest)\b/,
            /\b(show.*remaining|display.*remaining|get.*remaining)\b/,
            /\b(more.*result|more.*ticket|more.*data)\b/,
            /\b(continue.*list|continue.*show)\b/
        ];
        
        if (continuationPatterns.some(pattern => pattern.test(lowerMessage))) {
            // Check if we have previous results to continue from
            if (conversationContext.lastResults && conversationContext.lastResults.length > 0) {
                debugLog(`🔄 Continuation request detected with ${conversationContext.lastResults.length} previous results`);
                return {
                    action: "continue_query",
                    reasoning: "User wants to see more results from previous query",
                    needsData: true,
                    queryInstruction: "Continue showing results from previous query",
                    continuationData: {
                        lastResults: conversationContext.lastResults,
                        lastQuery: conversationContext.lastQuery,
                        offset: conversationContext.lastOffset || 20 // Default offset from where we left off
                    },
                    confidence: 0.98
                };
            } else {
                // No previous results to continue from
                return {
                    action: "chat",
                    reasoning: "User asked for more but no previous results available",
                    needsData: false,
                    conversationResponse: "I don't have any previous results to show more of. Please ask me to find some data first, like 'list all tickets' or 'show open tickets'.",
                    confidence: 0.9
                };
            }
        }
        
        // *** PRIORITY 2: SPECIFIC FIELD EXPLANATIONS (NEW!) ***
        const specificFieldPatterns = [
            /\bexplain.*\b(for me|to me)?\s*(what is|what's)\s*(a\s+)?(ticketid|ticket id)\b/i,
            /\bwhat is\s*(a\s+)?(ticketid|ticket id)\b/i,
            /\btell me about\s*(the\s+)?(ticketid|ticket id)\b/i,
            /\bexplain.*\b(ticketid|ticket id)\b/i,
            /\b(ticketid|ticket id)\s*explain\b/i
        ];
        
        if (specificFieldPatterns.some(pattern => pattern.test(lowerMessage))) {
            debugLog("🎯 Specific TicketID explanation requested");
            return {
                action: "explain",
                reasoning: "User requesting specific explanation of TicketID field",
                needsData: false,
                conversationResponse: this.generateSpecificFieldExplanation("TicketID"),
                confidence: 0.95
            };
        }
        
        // Check for other specific field requests
        if (/\bwhat is\s*(a\s+)?(ticketnumber|ticket number)\b/i.test(lowerMessage)) {
            return {
                action: "explain",
                reasoning: "User requesting specific explanation of TicketNumber field",
                needsData: false,
                conversationResponse: this.generateSpecificFieldExplanation("TicketNumber"),
                confidence: 0.95
            };
        }
        
        if (/\bwhat is\s*(a\s+)?(customerid|customer id)\b/i.test(lowerMessage)) {
            return {
                action: "explain",
                reasoning: "User requesting specific explanation of CustomerID field",
                needsData: false,
                conversationResponse: this.generateSpecificFieldExplanation("CustomerID"),
                confidence: 0.95
            };
        }
        
        // *** PRIORITY 3: GENERAL STRUCTURE EXPLANATIONS ***
        const generalExplanationPatterns = [
            /\b(explain|how does|how do|describe)\b.*\b(structure|data|database|work|system)\b/,
            /\bshow me.*\b(structure|schema|format|fields)\b/,
            /\bhow.*\b(organize|structure|store|data|work)\b/,
            /\bcan you.*\b(explain|describe|tell|show)\b.*\b(structure|schema|field)\b/
        ];
        
        if (generalExplanationPatterns.some(pattern => pattern.test(lowerMessage))) {
            return {
                action: "explain",
                reasoning: "User requesting general explanation/description of system",
                needsData: false,
                conversationResponse: this.generateDatabaseStructureExplanation(),
                confidence: 0.95
            };
        }
        
        // *** PRIORITY 4: GREETING PATTERNS ***
        if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(lowerMessage.trim())) {
            return {
                action: "chat",
                reasoning: "Simple greeting detected",
                needsData: false,
                conversationResponse: "Hello! I'm your super intelligent ticket database assistant. I can help you find tickets, search by customer, analyze data, or explain the system. What would you like to do?",
                confidence: 0.95
            };
        }
        
        // *** PRIORITY 5: SUMMARIZATION PATTERNS ***
        if (/\b(summarize|summary)\b.*\b(ticket|conversation)\b/i.test(lowerMessage)) {
            return {
                action: "summarize",
                reasoning: "Summarization request detected",
                needsData: true,
                summaryInstruction: `Summarize based on request: ${message}`,
                confidence: 0.9
            };
        }
        
        // *** PRIORITY 6: DATA REQUEST PATTERNS ***
        const dataRequestPatterns = [
            /\b(list|show|get|find|search|display)\b.*\b(all|ticket|id|customer|email)\b/,
            /\ball\b.*\b(ticket|id|customer)\b/,
            /\bticket.*\b(id|number|list)\b/,
            /\bhow many\b.*\b(ticket|customer)\b/,
            /\bcan you.*\b(list|show|find)\b.*\b(ticket|customer|data)\b/
        ];
        
        if (dataRequestPatterns.some(pattern => pattern.test(lowerMessage))) {
            return {
                action: "query",
                reasoning: "Data request detected",
                needsData: true,
                queryInstruction: this.generateQueryInstruction(lowerMessage),
                confidence: 0.9
            };
        }
        
        return null; // No obvious pattern
    }

    generateSpecificFieldExplanation(fieldName) {
        const explanations = {
            "TicketID": `🎫 **TicketID - Primary Ticket Identifier**

**What is TicketID?**
TicketID is the **primary numeric identifier** for each support ticket in your database.

**Key Details:**
- **Type**: Number (integer)
- **Example**: 13001952, 13000020, 13000025
- **Location**: \`data.ticket.TicketID\`
- **Uniqueness**: Each ticket has exactly one unique TicketID
- **Purpose**: Internal system identification and database indexing

**How it works:**
- TicketID is automatically generated when a ticket is created
- It's used internally by the system to link messages, attachments, and metadata
- Different from TicketNumber (which customers see)
- Always numeric and sequential

**Usage Examples:**
- "Find ticket 13001952" → Searches by TicketID
- "Summarize ticket 13000020" → Uses TicketID to locate specific ticket
- Database queries use TicketID for fast lookups

**Relationship to other fields:**
- Links to \`data.article.TicketID\` (messages belong to this ticket)
- Matches \`entityKey\` and \`key\` fields in the document root
- Different from \`TicketNumber\` which is the customer-facing identifier

TicketID is the backbone of your ticket system! 🚀`,

            "TicketNumber": `🎟️ **TicketNumber - Customer-Facing Identifier**

**What is TicketNumber?**
TicketNumber is the **customer-facing string identifier** that customers use to reference their support tickets.

**Key Details:**
- **Type**: String
- **Format**: YYYYMMDD + 8 digits (e.g., "2025090610000020")
- **Location**: \`data.ticket.TicketNumber\`
- **Purpose**: Customer communication and external references

**How it works:**
- More user-friendly than numeric TicketID
- Includes creation date in the format
- Used in customer emails and support communications
- Unique across the entire system

**Format Breakdown:**
"2025090610000020" means:
- 2025: Year
- 09: Month (September)
- 06: Day
- 10000020: Sequential number

**Usage:**
Customers reference tickets using this number in support communications.`,

            "CustomerID": `👤 **CustomerID - Customer Email Address**

**What is CustomerID?**
CustomerID is the **email address** of the customer who created the support ticket.

**Key Details:**
- **Type**: String (email format)
- **Example**: "john@email.com", "support@company.com"
- **Location**: \`data.ticket.CustomerID\`
- **Purpose**: Customer identification and communication

**How it works:**
- Primary way to identify which customer owns a ticket
- Used for filtering tickets by customer
- Links tickets to specific customer accounts
- Essential for customer service workflows

**Usage Examples:**
- "Find tickets from john@email.com" → Searches by CustomerID
- Customer service agents use this to find all tickets for a customer
- Used in automated email responses

CustomerID connects tickets to real people! 👥`
        };
        
        return explanations[fieldName] || `I don't have specific information about the ${fieldName} field. Please ask me about TicketID, TicketNumber, or CustomerID for detailed explanations.`;
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

    intelligentFallback(message, conversationContext, debugLog = () => {}) {
        const lowerMessage = message.toLowerCase();
        
        // Check if this might be a continuation request that wasn't caught
        if (/\b(more|next|continue|show|list|see)\b/.test(lowerMessage)) {
            if (conversationContext.lastResults && conversationContext.lastResults.length > 0) {
                return {
                    action: "continue_query",
                    reasoning: "Fallback detected possible continuation request with available previous results",
                    needsData: true,
                    queryInstruction: "Continue showing results from previous query",
                    continuationData: {
                        lastResults: conversationContext.lastResults,
                        lastQuery: conversationContext.lastQuery,
                        offset: conversationContext.lastOffset || 20
                    },
                    confidence: 0.7
                };
            }
        }
        
        // Check for explanation keywords
        if (/\b(what|how|explain|help|describe|tell|structure|schema|field|database|work)\b/.test(lowerMessage)) {
            return {
                action: "explain",
                reasoning: "Fallback detected explanation keywords",
                needsData: false,
                conversationResponse: this.generateCapabilityExplanation(),
                confidence: 0.7
            };
        }
        
        // Check for data-related keywords
        if (/\b(list|show|find|get|search|display|all|tickets?)\b/.test(lowerMessage)) {
            return {
                action: "query",
                reasoning: "Fallback detected data-related keywords",
                needsData: true,
                queryInstruction: "Get all tickets with basic information",
                confidence: 0.6
            };
        }
        
        // Default to conversation with context awareness
        let contextualResponse = "I'm your super intelligent ticket database assistant. I can help you find tickets, search by customer, analyze data, or explain the system. What would you like to do?";
        
        // Add context if we have previous results
        if (conversationContext.lastResults && conversationContext.lastResults.length > 0) {
            contextualResponse = `I'm your super intelligent ticket database assistant. I can help you find tickets, search by customer, analyze data, or explain the system. 

I still have ${conversationContext.lastResults.length} results from your last query if you'd like to see more. What would you like to do?`;
        }
        
        return {
            action: "chat",
            reasoning: "Fallback default to conversation with context awareness",
            needsData: false,
            conversationResponse: contextualResponse,
            confidence: 0.5
        };
    }

    generateDatabaseStructureExplanation() {
        return `🗄️ **Your Database Structure - Complete Explanation**

## 📊 **Overview**
Your database stores support tickets with **complete conversation histories**. Each document represents one ticket with all its messages, attachments, and metadata.

## 🏗️ **Document Structure**

### **Root Level:**
- **\`_id\`**: MongoDB unique identifier
- **\`key\`**: Primary conversation identifier (matches TicketID)
- **\`data\`**: Main content object containing ticket, articles, and attachments

### **🎫 Ticket Information (\`data.ticket\`)**

**Core Identifiers:**
- **\`TicketID\`**: Internal numeric ID (e.g., 13001952) 
- **\`TicketNumber\`**: External string ID (e.g., "2025082010043337")
- **\`Title\`**: Ticket subject/description

**Customer & Assignment:**
- **\`CustomerID\`**: Customer email address
- **\`Queue\`**: Department handling ticket
- **\`Owner\`**: Assigned agent username
- **\`Responsible\`**: Responsible party

**Status & Priority:**
- **\`State\`**: Detailed status (new, open, pending reminder, closed successful, etc.)
- **\`StateType\`**: Simplified status (new, open, pending, closed)
- **\`Priority\`**: Text priority ("1 very low" to "5 very high")
- **\`PriorityID\`**: Numeric priority (1-5)

**Timestamps:**
- **\`Created\`**: When ticket was created
- **\`Changed\`**: Last modification
- **\`Closed\`**: When ticket was closed (null if open)

### **💬 Messages (\`data.article\` array)**
Each message in the conversation:
- **\`ArticleID\`**: Unique message identifier
- **\`Subject\`**: Message subject line
- **\`Body\`**: Full message content (main searchable field)
- **\`From/To\`**: Sender and recipient
- **\`SenderType\`**: "customer", "agent", or "system"
- **\`CreateTime\`**: When message was created
- **\`IsVisibleForCustomer\`**: Whether customer can see (0/1)

### **📎 Attachments (\`data.attachment\` array)**
Files attached to messages:
- **\`Filename\`**: Original file name
- **\`ContentType\`**: MIME type (image/png, application/pdf, etc.)
- **\`FilesizeRaw\`**: File size in bytes

## 🔍 **Most Useful Search Fields**

1. **\`data.ticket.CustomerID\`** - Find all tickets for a customer
2. **\`data.ticket.TicketID\`** - Find specific ticket by ID
3. **\`data.ticket.StateType\`** - Filter by status (open, closed, etc.)
4. **\`data.article.Body\`** - Search message content
5. **\`data.ticket.Created\`** - Filter by creation date
6. **\`data.ticket.PriorityID\`** - Filter by priority level

## 💡 **How I Can Help**

- **"list all ticket IDs"** → Gets every TicketID
- **"find tickets from john@email.com"** → Customer search
- **"show open tickets"** → Status filtering  
- **"search for login issues"** → Full-text search in messages
- **"summarize ticket 12345"** → Detailed ticket analysis
- **"see more"** → Continue from previous results

Your data is perfectly organized for comprehensive support management! 🚀`;
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

🗄️ **Structure Explanations**:
• "explain how my data structure works" - Complete schema overview
• "what is a ticketID" - Field explanations
• "describe the database" - Detailed structure

🔄 **Continuation Support**:
• "see more" - Continue from previous results
• "show more" - Display additional data
• I remember your previous queries!

Just ask me naturally! I understand database requests with super intelligence and remember our conversation.`;
    }

    async generateFinalResponse(userMessage, processingResults, conversationContext, debugLog = () => {}) {
        debugLog("🗣️ Generating final response with memory awareness");
        
        try {
            if (processingResults.data?.type === 'query_results') {
                return processingResults.data.response || `I found ${processingResults.data.resultCount} results.`;
            } else if (processingResults.data?.type === 'continuation_results') {
                return processingResults.data.response || `Here are more results from your previous query.`;
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