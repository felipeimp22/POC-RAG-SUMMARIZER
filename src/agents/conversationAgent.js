// src/agents/conversationAgent.js - TRUE CONVERSATIONAL AI
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import mongoConnection from '../db/mongodb.js';
import { summarizationAgent } from './summarizationAgent.js';
import conversationMemory from '../services/conversationMemory.js';

// Use a capable model
const conversationModel = new ChatOllama({
    temperature: 0.7,
    maxRetries: 2,
    model: process.env.CONVERSATION_MODEL || 'llama2:7b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

const queryModel = new ChatOllama({
    temperature: 0.1,
    maxRetries: 2,
    model: process.env.QUERY_MODEL || 'deepseek-coder:6.7b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

class ConversationAgent {
    constructor() {
        this.db = null;
        this.initializeKnowledge();
    }

    initializeKnowledge() {
        // The AI needs to KNOW what it can do
        this.capabilities = {
            viewing: "I can show you conversations/tickets from the database. Just ask to see all tickets, specific ones, or filter by customer/status/priority.",
            searching: "I can search by ticket ID, ticket number, customer email, keywords in title/body, date ranges, queues, or status.",
            summarizing: "I can summarize any conversation - just give me a ticket ID or number.",
            analyzing: "I can analyze patterns, count tickets by status/queue/priority, show trends, and provide statistics.",
            explaining: "I can explain the database structure, what fields are available, and how the data is organized.",
            helping: "I'm here to help you navigate and understand your ticket data. Just ask naturally!"
        };
        
        this.dataStructure = {
            ticket: {
                TicketID: "Numeric ID (e.g., 13001952)",
                TicketNumber: "String ID (e.g., '2025082010043337')",
                Title: "Subject of the ticket",
                CustomerID: "Customer email address",
                State: "Current status (open, closed, pending, etc.)",
                Priority: "1-5 scale (very low to very high)",
                Queue: "Department handling the ticket",
                Created: "When ticket was created",
                Owner: "Agent assigned to ticket"
            },
            articles: "Messages within each ticket conversation",
            attachments: "Files attached to messages"
        };
    }

    async init() {
        if (!this.db) {
            this.db = await mongoConnection.connect();
        }
    }

    async processMessage({ message, sessionId = 'default', context = {}, debugLog = () => {} }) {
        await this.init();
        
        debugLog("🤖 Processing: " + message);
        
        try {
            // Get conversation history
            const history = conversationMemory.getConversationSummary(sessionId);
            
            // Step 1: Understand what the user REALLY wants
            const understanding = await this.understandUserIntent(message, history, debugLog);
            debugLog("Understanding:", JSON.stringify(understanding, null, 2));
            
            // Step 2: Generate appropriate response based on understanding
            let response;
            
            switch (understanding.primaryIntent) {
                case 'how_to':
                    response = await this.handleHowToQuestion(understanding, sessionId, debugLog);
                    break;
                    
                case 'show_data':
                    response = await this.handleShowData(understanding, sessionId, debugLog);
                    break;
                    
                case 'explain':
                    response = await this.handleExplanation(understanding, sessionId, debugLog);
                    break;
                    
                case 'summarize':
                    response = await this.handleSummarize(understanding, sessionId, debugLog);
                    break;
                    
                case 'analyze':
                    response = await this.handleAnalysis(understanding, sessionId, debugLog);
                    break;
                    
                case 'clarification_needed':
                    response = await this.askForClarification(understanding, sessionId, debugLog);
                    break;
                    
                default:
                    response = await this.handleGeneralConversation(message, understanding, sessionId, debugLog);
            }
            
            // Store interaction
            conversationMemory.addInteraction(sessionId, {
                userMessage: message,
                intent: understanding,
                response: response.response,
                queryExecuted: response.query || null,
                resultsFound: response.resultCount || 0
            });
            
            return { ...response, sessionId };
            
        } catch (error) {
            debugLog("❌ Error:", error);
            return {
                response: `I ran into an issue: ${error.message}. Could you rephrase that or let me know what you're looking for?`,
                type: 'error',
                sessionId
            };
        }
    }
    
    async understandUserIntent(message, history, debugLog) {
        const understandingPrompt = ChatPromptTemplate.fromTemplate(`
You are having a conversation about a ticket/conversation database. Understand what the user wants.

User said: "{message}"
Previous context: {history}

The database contains:
- Tickets with IDs, customer info, status, priority, queues
- Articles (messages) in conversations
- Attachments on messages

Analyze the user's message and determine:
{{
  "primaryIntent": "how_to|show_data|explain|summarize|analyze|clarification_needed|general",
  "confidence": 0.0-1.0,
  "reasoning": "Why you chose this intent",
  "specificRequest": {{
    "wantsToKnow": "What specifically they want to know",
    "needsClarification": boolean,
    "clarificationReason": "Why clarification is needed if true"
  }},
  "entities": {{
    "ticketId": null or number,
    "ticketNumber": null or string,
    "customer": null or email,
    "status": null or string,
    "keywords": [] or ["search", "terms"]
  }},
  "responseType": "explanation|list|details|help|conversation"
}}

Intent types:
- how_to: User asking HOW to do something ("how can I see", "how do I find")
- show_data: User wants to see actual data ("show me", "list", "find")
- explain: User wants explanation of structure/fields ("what fields", "explain structure")
- summarize: User wants a summary of specific ticket
- analyze: User wants statistics/analysis
- clarification_needed: Genuinely unclear what they want
- general: General conversation/question

Examples:
"How can I see the conversation?" → how_to (they want to know HOW to view conversations)
"Show me all tickets" → show_data (they want to see actual tickets)
"What fields are in tickets?" → explain (they want structure explanation)
"I want to see ticket 123" → show_data (specific data request)

BE INTELLIGENT. If someone asks "how can I see" they want instructions, not empty search results!

Return ONLY the JSON.
`);

        try {
            const chain = understandingPrompt.pipe(conversationModel).pipe(new StringOutputParser());
            const response = await chain.invoke({
                message,
                history: JSON.stringify(history || {})
            });
            
            const understanding = JSON.parse(response.replace(/```json|```/g, '').trim());
            understanding.originalMessage = message;
            return understanding;
            
        } catch (error) {
            debugLog("Failed to understand, using fallback");
            
            // Fallback understanding based on keywords
            if (/how (can|do|to)|what (can|do)/i.test(message)) {
                return {
                    primaryIntent: 'how_to',
                    confidence: 0.7,
                    reasoning: 'Question about how to do something',
                    originalMessage: message
                };
            }
            
            if (/show|list|find|get|display/i.test(message)) {
                return {
                    primaryIntent: 'show_data',
                    confidence: 0.7,
                    reasoning: 'Request to see data',
                    originalMessage: message
                };
            }
            
            return {
                primaryIntent: 'general',
                confidence: 0.5,
                reasoning: 'General question',
                originalMessage: message
            };
        }
    }
    
    async handleHowToQuestion(understanding, sessionId, debugLog) {
        debugLog("📚 Handling 'how to' question");
        
        const message = understanding.originalMessage.toLowerCase();
        
        // Specific how-to responses
        if (message.includes('conversation') || message.includes('messages')) {
            return {
                response: `**How to view conversations:**

You can see conversations in several ways:

1. **View all tickets:** Say "show me all tickets" or "list all conversations"
   
2. **View specific ticket:** Provide the ticket ID or number:
   - "Show ticket ID 13001952"
   - "Display ticket number 2025082010043337"
   
3. **Search by customer:** "Show tickets from customer@email.com"

4. **Filter by status:** "Show open tickets" or "List closed tickets"

5. **Get details:** Once you see the list, you can ask for details or summaries of specific tickets.

Would you like me to show you all available conversations now?`,
                type: 'help',
                responseType: 'explanation'
            };
        }
        
        if (message.includes('search') || message.includes('find')) {
            return {
                response: `**How to search the database:**

You can search in many ways:

- **By Ticket ID:** "Find ticket ID 13001952"
- **By Ticket Number:** "Search for 2025082010043337"
- **By Customer:** "Find tickets from john@email.com"
- **By Keywords:** "Search for billing issues"
- **By Status:** "Find all open tickets"
- **By Priority:** "Show high priority tickets"
- **By Queue:** "List tickets in Technical Support"
- **By Date:** "Show tickets from last week"

Just tell me what you're looking for naturally, and I'll find it!`,
                type: 'help',
                responseType: 'explanation'
            };
        }
        
        // General help
        return {
            response: `**Here's what I can help you with:**

${Object.entries(this.capabilities).map(([key, value]) => `• **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}`).join('\n\n')}

What would you like to do? Just ask naturally!`,
            type: 'help',
            responseType: 'explanation'
        };
    }
    
    async handleShowData(understanding, sessionId, debugLog) {
        debugLog("📊 Showing data");
        
        // Build query from understanding
        const mongoQuery = await this.buildMongoQuery(understanding, debugLog);
        
        // Execute query
        const results = await mongoConnection.findConversations(
            mongoQuery.filter,
            mongoQuery.options
        );
        
        debugLog(`Found ${results.length} results`);
        
        // Format results conversationally
        if (results.length === 0) {
            return {
                response: `I didn't find any conversations matching that criteria. 

Would you like to:
- See all available tickets? (say "show all tickets")
- Try a different search? (tell me what you're looking for)
- Learn about the search options? (say "how do I search")`,
                type: 'no_results',
                resultCount: 0,
                query: mongoQuery
            };
        }
        
        // Format results based on count
        let response = this.formatResults(results, understanding);
        
        return {
            response,
            type: 'data_results',
            resultCount: results.length,
            query: mongoQuery
        };
    }
    
    formatResults(results, understanding) {
        if (results.length === 1) {
            // Single result - show details
            const ticket = results[0].data.ticket;
            const articles = results[0].data.article || [];
            const attachments = results[0].data.attachment || [];
            
            return `**Found the ticket:**

📋 **Ticket Details:**
- **ID:** ${ticket.TicketID} | **Number:** ${ticket.TicketNumber}
- **Title:** ${ticket.Title}
- **Customer:** ${ticket.CustomerID}
- **Status:** ${ticket.State} (${ticket.StateType})
- **Priority:** ${ticket.Priority}
- **Queue:** ${ticket.Queue}
- **Owner:** ${ticket.Owner}
- **Created:** ${new Date(ticket.Created).toLocaleString()}
${ticket.Closed ? `• **Closed:** ${ticket.Closed}` : '• **Still Open**'}

💬 **Conversation:** ${articles.length} message${articles.length !== 1 ? 's' : ''}
📎 **Attachments:** ${attachments.length} file${attachments.length !== 1 ? 's' : ''}

${articles.length > 0 ? `\n**First message:**
From: ${articles[0].From}
"${articles[0].Body.substring(0, 200)}..."` : ''}

Would you like me to summarize this conversation?`;
        }
        
        // Multiple results - list format
        let response = `**Found ${results.length} conversation${results.length !== 1 ? 's' : ''}:**\n\n`;
        
        results.slice(0, 10).forEach((conv, idx) => {
            const ticket = conv.data.ticket;
            const articles = conv.data.article || [];
            
            response += `${idx + 1}. **[${ticket.TicketNumber}]** ${ticket.Title}\n`;
            response += `   📧 ${ticket.CustomerID} | 🔄 ${ticket.State}\n`;
            response += `   📋 ID: ${ticket.TicketID} | 💬 ${articles.length} messages\n`;
            response += `   📅 ${new Date(ticket.Created).toLocaleDateString()}\n\n`;
        });
        
        if (results.length > 10) {
            response += `... and ${results.length - 10} more.\n\n`;
        }
        
        response += `\n**What would you like to do?**
- See details of a specific ticket (give me the ID or number)
- Summarize a conversation
- Filter these results further
- Export to a report`;
        
        return response;
    }
    
    async buildMongoQuery(understanding, debugLog) {
        const query = {
            filter: {},
            options: {
                limit: 50,
                sort: { "data.ticket.Created": -1 }
            }
        };
        
        // Add filters from entities
        if (understanding.entities) {
            if (understanding.entities.ticketId) {
                query.filter["data.ticket.TicketID"] = understanding.entities.ticketId;
                query.options.limit = 1;
            }
            if (understanding.entities.ticketNumber) {
                query.filter["data.ticket.TicketNumber"] = understanding.entities.ticketNumber;
                query.options.limit = 1;
            }
            if (understanding.entities.customer) {
                query.filter["data.ticket.CustomerID"] = {
                    $regex: understanding.entities.customer,
                    $options: "i"
                };
            }
            if (understanding.entities.status) {
                if (understanding.entities.status === 'open') {
                    query.filter["data.ticket.StateType"] = { $in: ["open", "new", "pending"] };
                } else if (understanding.entities.status === 'closed') {
                    query.filter["data.ticket.StateType"] = "closed";
                } else {
                    query.filter["data.ticket.State"] = {
                        $regex: understanding.entities.status,
                        $options: "i"
                    };
                }
            }
            if (understanding.entities.keywords && understanding.entities.keywords.length > 0) {
                const pattern = understanding.entities.keywords.join("|");
                query.filter.$or = [
                    { "data.ticket.Title": { $regex: pattern, $options: "i" } },
                    { "data.article.Body": { $regex: pattern, $options: "i" } }
                ];
            }
        }
        
        return query;
    }
    
    async handleExplanation(understanding, sessionId, debugLog) {
        debugLog("📖 Explaining structure/fields");
        
        const message = understanding.originalMessage.toLowerCase();
        
        if (message.includes('field') || message.includes('structure')) {
            return {
                response: `**Database Structure:**

The database contains conversations/tickets with this structure:

**📋 Ticket Fields:**
${Object.entries(this.dataStructure.ticket).map(([field, desc]) => `• **${field}:** ${desc}`).join('\n')}

**💬 Articles:** ${this.dataStructure.articles}
**📎 Attachments:** ${this.dataStructure.attachments}

Each conversation is a complete ticket with all its messages and files.

You can search or filter by any of these fields. What would you like to know more about?`,
                type: 'explanation',
                responseType: 'structure'
            };
        }
        
        return {
            response: `I can explain various aspects of the system. What would you like to know about?
- The data structure and fields
- How to search and filter
- What information is available
- How to use specific features

Just ask!`,
            type: 'explanation'
        };
    }
    
    async askForClarification(understanding, sessionId, debugLog) {
        debugLog("❓ Asking for clarification");
        
        return {
            response: `I'm not quite sure what you're looking for. Could you help me understand?

Are you trying to:
- **See data?** Tell me what tickets/conversations you want to see
- **Learn how to use the system?** Ask "how do I..." or "how can I..."
- **Understand the structure?** Ask about fields or data structure
- **Get a summary?** Give me a ticket ID or number to summarize
- **Analyze data?** Ask for statistics or patterns

Just tell me naturally what you need!`,
            type: 'clarification',
            needsClarification: true
        };
    }
    
    async handleGeneralConversation(message, understanding, sessionId, debugLog) {
        debugLog("💬 General conversation");
        
        const conversationalPrompt = ChatPromptTemplate.fromTemplate(`
You're a helpful assistant for a ticket/conversation database. Respond naturally to the user.

User said: "{message}"
Understanding: {understanding}

You can:
- Show tickets/conversations
- Search by various criteria
- Summarize conversations
- Explain the system
- Analyze data

Be conversational, helpful, and guide them to what they need. If unsure, ask clarifying questions.
Don't just return empty results - help them get what they need!
`);

        try {
            const chain = conversationalPrompt.pipe(conversationModel).pipe(new StringOutputParser());
            const response = await chain.invoke({
                message,
                understanding: JSON.stringify(understanding)
            });
            
            return {
                response,
                type: 'conversation',
                responseType: 'general'
            };
        } catch (error) {
            return {
                response: `Let me help you with your ticket database. What would you like to do?
- See some tickets? 
- Search for something specific?
- Get a summary?
- Learn how to use the system?

Just let me know!`,
                type: 'help'
            };
        }
    }
    
    async handleSummarize(understanding, sessionId, debugLog) {
        debugLog("📝 Summarizing");
        
        if (!understanding.entities?.ticketId && !understanding.entities?.ticketNumber) {
            return {
                response: `To summarize a conversation, I need to know which one. You can provide:
- Ticket ID (like 13001952)
- Ticket Number (like "2025082010043337")

Or I can show you all tickets first so you can choose one?`,
                type: 'clarification'
            };
        }
        
        // Find and summarize
        const filter = {};
        if (understanding.entities.ticketId) {
            filter["data.ticket.TicketID"] = understanding.entities.ticketId;
        } else {
            filter["data.ticket.TicketNumber"] = understanding.entities.ticketNumber;
        }
        
        const results = await mongoConnection.findConversations(filter, { limit: 1 });
        
        if (results.length === 0) {
            return {
                response: `I couldn't find that ticket. Please check the ID or number, or let me show you available tickets?`,
                type: 'error'
            };
        }
        
        const summary = await summarizationAgent.summarize(results[0], debugLog);
        
        return {
            response: summary,
            type: 'summary'
        };
    }
    
    async handleAnalysis(understanding, sessionId, debugLog) {
        debugLog("📊 Analyzing");
        
        // Get all data for analysis
        const results = await mongoConnection.findConversations({}, { limit: 1000 });
        
        const stats = {
            total: results.length,
            byStatus: {},
            byQueue: {},
            byPriority: {},
            topCustomers: {}
        };
        
        results.forEach(r => {
            const ticket = r.data.ticket;
            stats.byStatus[ticket.State] = (stats.byStatus[ticket.State] || 0) + 1;
            stats.byQueue[ticket.Queue] = (stats.byQueue[ticket.Queue] || 0) + 1;
            stats.byPriority[ticket.Priority] = (stats.byPriority[ticket.Priority] || 0) + 1;
            stats.topCustomers[ticket.CustomerID] = (stats.topCustomers[ticket.CustomerID] || 0) + 1;
        });
        
        const response = `**📊 Database Analysis:**

**Overview:**
- Total tickets: ${stats.total}

**Status Distribution:**
${Object.entries(stats.byStatus).sort((a,b) => b[1]-a[1]).slice(0,5).map(([s,c]) => `• ${s}: ${c}`).join('\n')}

**Top Queues:**
${Object.entries(stats.byQueue).sort((a,b) => b[1]-a[1]).slice(0,5).map(([q,c]) => `• ${q}: ${c}`).join('\n')}

**Priority Breakdown:**
${Object.entries(stats.byPriority).sort().map(([p,c]) => `• ${p}: ${c}`).join('\n')}

**Most Active Customers:**
${Object.entries(stats.topCustomers).sort((a,b) => b[1]-a[1]).slice(0,5).map(([c,n]) => `• ${c}: ${n} tickets`).join('\n')}

Would you like more detailed analysis of any specific area?`;
        
        return {
            response,
            type: 'analysis'
        };
    }
}

const conversationAgent = new ConversationAgent();
export { conversationAgent };
export default conversationAgent;