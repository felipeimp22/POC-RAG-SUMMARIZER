// src/core/AIOrchestrator.js - INTELLIGENT ORCHESTRATION
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import mongoConnection from '../db/mongodb.js';

// Initialize AI models
const orchestratorModel = new ChatOllama({
    temperature: 0.7,
    maxRetries: 2,
    model: process.env.CONVERSATION_MODEL || 'llama2:7b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

const queryBuilderModel = new ChatOllama({
    temperature: 0.1,
    maxRetries: 2,
    model: process.env.QUERY_MODEL || 'deepseek-coder:6.7b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

const formatterModel = new ChatOllama({
    temperature: 0.5,
    maxRetries: 2,
    model: process.env.SUMMARIZATION_MODEL || 'mistral:7b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

class AIOrchestrator {
    constructor() {
        this.memory = new Map(); // Simple in-memory storage
        this.db = null;
        this.structureKnowledge = this.loadStructureKnowledge();
    }

    loadStructureKnowledge() {
        return `
DATABASE STRUCTURE:
- Each document is a complete conversation/ticket
- Root fields: _id, key, channel, entity, entityKey, createdAt, updatedAt, handled, version, idx, ref
- Main data in 'data' field containing:
  
data.ticket (30+ fields):
  - TicketID: numeric ID (e.g., 13001952)
  - TicketNumber: string ID (e.g., "2025082010043337") 
  - Title: ticket subject
  - CustomerID: customer email
  - CustomerUserID: alternate customer ID
  - State: detailed status (new, open, pending reminder, closed successful, etc.)
  - StateType: simplified (new, open, pending, closed)
  - Priority: "1 very low" to "5 very high"
  - PriorityID: numeric 1-5
  - Queue: department name
  - QueueID: numeric queue ID
  - Owner: assigned agent username
  - OwnerID: numeric owner ID
  - Responsible: responsible party username
  - ResponsibleID: numeric responsible ID
  - Created: creation timestamp
  - Changed: last modification timestamp
  - Closed: closure timestamp (null if open)
  - Age: seconds since creation
  - SolutionInMin: resolution time in minutes
  - Type: ticket type (usually "default")
  - Lock: lock status
  - ArchiveFlag: "y" or "n"
  - DynamicField: array of custom fields

data.article[] (messages):
  - ArticleID: unique message ID
  - ArticleNumber: sequence in conversation (1, 2, 3...)
  - TicketID: parent ticket ID
  - Subject: message subject
  - Body: message content
  - From: sender email/name
  - To: recipient
  - SenderType: "customer", "agent", or "system"
  - SenderTypeID: "1"=agent, "2"=system, "3"=customer
  - CreateTime: when message was created
  - IsVisibleForCustomer: 0 or 1
  - ContentType: MIME type
  - MessageID: email message ID

data.attachment[] (files):
  - Filename: original filename
  - ContentType: MIME type
  - FilesizeRaw: size in bytes
  - FileID: identifier within article
  - Disposition: "inline" or "attachment"
  - path: storage path
  - _article: parent article ID
`;
    }

    async init() {
        if (!this.db) {
            this.db = await mongoConnection.connect();
        }
    }

    async processConversation(message, sessionId, debugLog = () => {}) {
        await this.init();
        debugLog("🧠 AI Orchestrator processing:", message);

        // Get or create session memory
        if (!this.memory.has(sessionId)) {
            this.memory.set(sessionId, {
                history: [],
                lastTicket: null,
                lastQuery: null,
                lastResults: null,
                context: {}
            });
        }
        
        const sessionMemory = this.memory.get(sessionId);
        
        try {
            // Step 1: Orchestrator understands the request in context
            const understanding = await this.understand(message, sessionMemory, debugLog);
            debugLog("Understanding:", understanding);

            // Step 2: Execute based on understanding
            let response;
            
            if (understanding.needsData) {
                // Build and execute query
                const queryResult = await this.buildAndExecuteQuery(understanding, sessionMemory, debugLog);
                sessionMemory.lastQuery = queryResult.query;
                sessionMemory.lastResults = queryResult.results;
                
                // Format response based on user's request
                response = await this.formatResponse(
                    understanding,
                    queryResult.results,
                    sessionMemory,
                    debugLog
                );
                
                // Update last ticket if single result
                if (queryResult.results.length === 1) {
                    sessionMemory.lastTicket = queryResult.results[0];
                }
            } else if (understanding.isContinuation) {
                // Handle continuation (like "yes" to summarize)
                response = await this.handleContinuation(understanding, sessionMemory, debugLog);
            } else {
                // Direct response without data
                response = await this.generateDirectResponse(understanding, sessionMemory, debugLog);
            }

            // Update memory
            sessionMemory.history.push({
                userMessage: message,
                understanding: understanding,
                response: response,
                timestamp: new Date()
            });

            // Keep only last 10 interactions
            if (sessionMemory.history.length > 10) {
                sessionMemory.history.shift();
            }

            return response;

        } catch (error) {
            debugLog("❌ Error:", error);
            return {
                response: `I encountered an issue: ${error.message}. Let me know what you're looking for and I'll help.`,
                type: 'error',
                sessionId
            };
        }
    }

    async understand(message, sessionMemory, debugLog) {
        const understandPrompt = ChatPromptTemplate.fromTemplate(`
You are an intelligent AI orchestrator for a ticket database. Understand what the user wants.

Current message: "{message}"

Recent conversation history:
{history}

Last ticket viewed: {lastTicket}
Last query results count: {lastResultsCount}

Database structure summary:
{structure}

Understand the user's request and return a JSON response:
{{
  "intent": "Brief description of what user wants",
  "needsData": true/false,
  "isContinuation": true/false,
  "queryParams": {{
    "searchType": "all|specific|filter",
    "fields": ["specific fields needed"],
    "filters": {{}},
    "limit": number
  }},
  "formatAs": "list|details|summary|ids_only|count|analysis",
  "summarize": true/false,
  "multiTicketSummary": [] // array of ticket IDs if multiple summaries needed,
  "respondWith": "If no data needed, what to respond"
}}

Examples:
- "yes" (after asking to summarize) → isContinuation: true, summarize: true
- "show all ticket IDs" → needsData: true, formatAs: "ids_only"
- "summarize that" → isContinuation: true, summarize: true
- "how many open tickets" → needsData: true, formatAs: "count", filters: {state: "open"}
- "hi" → needsData: false, respondWith: "greeting"

BE SMART. Understand context from history. If user says "yes" check what they're agreeing to.
`);

        try {
            const history = sessionMemory.history.slice(-3).map(h => 
                `User: ${h.userMessage}\nBot: ${h.response?.response?.substring(0, 100)}...`
            ).join('\n');

            const lastTicketInfo = sessionMemory.lastTicket ? 
                `ID: ${sessionMemory.lastTicket.data.ticket.TicketID}, Number: ${sessionMemory.lastTicket.data.ticket.TicketNumber}` : 
                'None';

            const chain = understandPrompt.pipe(orchestratorModel).pipe(new StringOutputParser());
            const response = await chain.invoke({
                message,
                history: history || 'No previous messages',
                lastTicket: lastTicketInfo,
                lastResultsCount: sessionMemory.lastResults?.length || 0,
                structure: this.structureKnowledge
            });

            return JSON.parse(response.replace(/```json|```/g, '').trim());
        } catch (error) {
            debugLog("Understanding failed, using fallback");
            
            // Smart fallback
            if (message.toLowerCase() === 'yes' || message.toLowerCase() === 'ok' || message.toLowerCase() === 'sure') {
                return { isContinuation: true, intent: "Agreement to previous question" };
            }
            
            if (/show|list|get|find|all/i.test(message)) {
                return { needsData: true, intent: "Show data", formatAs: "list" };
            }
            
            return { needsData: false, intent: "General", respondWith: "help" };
        }
    }

    async buildAndExecuteQuery(understanding, sessionMemory, debugLog) {
        const queryPrompt = ChatPromptTemplate.fromTemplate(`
You are a MongoDB query expert. Build a precise query based on the user's request.

User wants: {intent}
Query parameters: {queryParams}

Database structure:
{structure}

Generate a MongoDB query:
{{
  "filter": {{}},
  "options": {{
    "limit": 50,
    "sort": {{}},
    "projection": {{}}
  }},
  "explanation": "What this query does"
}}

Field mappings:
- TicketID → data.ticket.TicketID (number)
- TicketNumber → data.ticket.TicketNumber (string)
- CustomerID → data.ticket.CustomerID (email)
- State → data.ticket.State or data.ticket.StateType
- Priority → data.ticket.PriorityID (1-5) or data.ticket.Priority
- Queue → data.ticket.Queue
- Title → data.ticket.Title
- Body → data.article.Body (in array)

Examples:
- "all tickets" → filter: {{}}, limit: 1000
- "ticket ID 13001952" → filter: {{"data.ticket.TicketID": 13001952}}
- "open tickets" → filter: {{"data.ticket.StateType": {{"$in": ["open", "new", "pending"]}}}}
- "high priority" → filter: {{"data.ticket.PriorityID": {{"$gte": 4}}}}

Return ONLY the JSON.
`);

        try {
            const chain = queryPrompt.pipe(queryBuilderModel).pipe(new StringOutputParser());
            const response = await chain.invoke({
                intent: understanding.intent,
                queryParams: JSON.stringify(understanding.queryParams || {}),
                structure: this.structureKnowledge
            });

            const query = JSON.parse(response.replace(/```json|```/g, '').trim());
            
            // Execute query
            const results = await mongoConnection.findConversations(
                query.filter || {},
                query.options || { limit: 50, sort: { "data.ticket.Created": -1 } }
            );

            debugLog(`Query executed: ${results.length} results`);
            
            return { query, results };
        } catch (error) {
            debugLog("Query failed:", error);
            // Fallback query
            const results = await mongoConnection.findConversations(
                {},
                { limit: 20, sort: { "data.ticket.Created": -1 } }
            );
            return { query: {}, results };
        }
    }

    async formatResponse(understanding, results, sessionMemory, debugLog) {
        const formatPrompt = ChatPromptTemplate.fromTemplate(`
Format the query results based on what the user requested.

User intent: {intent}
Format as: {formatAs}
Results count: {count}
Should summarize: {summarize}

Sample data:
{sampleData}

Database structure info:
{structure}

Create a response that:
1. Matches exactly what the user asked for
2. Is conversational and helpful
3. Uses appropriate formatting (lists, tables, details)
4. Includes relevant fields based on request
5. Suggests logical next steps

For formatting:
- "ids_only" → Just list the TicketIDs
- "list" → Formatted list with key details
- "details" → Comprehensive information
- "summary" → Create narrative summary
- "count" → Statistics and counts
- "analysis" → Patterns and insights

If user asked to summarize, create a comprehensive summary of the ticket(s).
If no results, explain and suggest alternatives.
`);

        try {
            // Prepare sample data
            const sampleData = results.slice(0, 3).map(r => ({
                ticketID: r.data.ticket.TicketID,
                ticketNumber: r.data.ticket.TicketNumber,
                title: r.data.ticket.Title,
                customer: r.data.ticket.CustomerID,
                state: r.data.ticket.State,
                messages: r.data.article?.length || 0
            }));

            const chain = formatPrompt.pipe(formatterModel).pipe(new StringOutputParser());
            const response = await chain.invoke({
                intent: understanding.intent,
                formatAs: understanding.formatAs || 'list',
                count: results.length,
                summarize: understanding.summarize || false,
                sampleData: JSON.stringify(sampleData),
                structure: this.structureKnowledge
            });

            // Special handling for specific formats
            if (understanding.formatAs === 'ids_only') {
                const ids = results.map(r => r.data.ticket.TicketID);
                return {
                    response: `**All Ticket IDs in the database (${ids.length} total):**\n\n${ids.join(', ')}\n\nNeed details about any specific ticket? Just ask!`,
                    type: 'data',
                    sessionId: sessionMemory.sessionId
                };
            }

            if (understanding.summarize && results.length > 0) {
                return await this.createSummary(results, understanding, sessionMemory, debugLog);
            }

            return {
                response,
                type: 'data',
                resultCount: results.length,
                sessionId: sessionMemory.sessionId
            };
        } catch (error) {
            debugLog("Formatting failed:", error);
            // Fallback formatting
            return this.fallbackFormat(results, understanding);
        }
    }

    async createSummary(tickets, understanding, sessionMemory, debugLog) {
        const summaryPrompt = ChatPromptTemplate.fromTemplate(`
Create a comprehensive summary of the ticket(s).

Ticket data:
{ticketData}

Create a well-structured summary including:
- Issue overview
- Customer and ticket details
- Conversation flow (who said what, when)
- Current status and resolution
- Key points and decisions
- Attachments mentioned

Make it narrative and easy to understand.
For multiple tickets, summarize each separately then provide overall insights.
`);

        try {
            // Prepare ticket data for summary
            const ticketData = tickets.slice(0, 3).map(t => ({
                ticket: t.data.ticket,
                messages: t.data.article?.map(a => ({
                    from: a.From,
                    to: a.To,
                    subject: a.Subject,
                    body: a.Body,
                    time: a.CreateTime,
                    type: a.SenderType
                })),
                attachments: t.data.attachment?.map(a => a.Filename)
            }));

            const chain = summaryPrompt.pipe(formatterModel).pipe(new StringOutputParser());
            const summary = await chain.invoke({
                ticketData: JSON.stringify(ticketData, null, 2)
            });

            return {
                response: summary,
                type: 'summary',
                sessionId: sessionMemory.sessionId
            };
        } catch (error) {
            return {
                response: "I couldn't generate the summary. Here's what I found: " + this.fallbackFormat(tickets, understanding).response,
                type: 'error',
                sessionId: sessionMemory.sessionId
            };
        }
    }

    async handleContinuation(understanding, sessionMemory, debugLog) {
        debugLog("Handling continuation from previous context");
        
        // Check what we're continuing from
        const lastInteraction = sessionMemory.history[sessionMemory.history.length - 1];
        
        if (!lastInteraction) {
            return {
                response: "I'm not sure what you're referring to. Could you clarify what you'd like me to do?",
                type: 'clarification',
                sessionId: sessionMemory.sessionId
            };
        }

        // If last response asked about summarizing and user said yes
        if (lastInteraction.response?.response?.includes('summarize') && 
            (understanding.intent.toLowerCase().includes('agreement') || understanding.intent.toLowerCase().includes('yes'))) {
            
            if (sessionMemory.lastTicket) {
                return await this.createSummary([sessionMemory.lastTicket], { summarize: true }, sessionMemory, debugLog);
            } else if (sessionMemory.lastResults && sessionMemory.lastResults.length > 0) {
                return await this.createSummary(sessionMemory.lastResults.slice(0, 3), { summarize: true }, sessionMemory, debugLog);
            }
        }

        // Default continuation handling
        return {
            response: "I understand you want to continue from our previous discussion. " + 
                     (sessionMemory.lastTicket ? 
                      `We were looking at ticket ${sessionMemory.lastTicket.data.ticket.TicketID}. What would you like to know about it?` :
                      "What would you like me to help you with?"),
            type: 'continuation',
            sessionId: sessionMemory.sessionId
        };
    }

    async generateDirectResponse(understanding, sessionMemory, debugLog) {
        const directPrompt = ChatPromptTemplate.fromTemplate(`
Generate a helpful response for the user's message.

User intent: {intent}
Respond with: {respondWith}
Conversation context: {context}

You're an intelligent assistant for a ticket database. Be helpful, conversational, and guide the user.
Available capabilities: view tickets, search, filter, summarize, analyze, explain structure.

Generate an appropriate response.
`);

        try {
            const chain = directPrompt.pipe(orchestratorModel).pipe(new StringOutputParser());
            const response = await chain.invoke({
                intent: understanding.intent,
                respondWith: understanding.respondWith || 'general help',
                context: JSON.stringify(sessionMemory.history.slice(-2))
            });

            return {
                response,
                type: 'direct',
                sessionId: sessionMemory.sessionId
            };
        } catch (error) {
            return {
                response: "Hello! I can help you with your ticket database. You can ask me to show tickets, search for specific ones, summarize conversations, or analyze your data. What would you like to do?",
                type: 'help',
                sessionId: sessionMemory.sessionId
            };
        }
    }

    fallbackFormat(results, understanding) {
        if (results.length === 0) {
            return {
                response: "No tickets found. Try asking to 'show all tickets' or search with different criteria.",
                type: 'no_results'
            };
        }

        let response = `Found ${results.length} ticket(s):\n\n`;
        results.slice(0, 10).forEach((r, i) => {
            const t = r.data.ticket;
            response += `${i+1}. **${t.TicketNumber}** (ID: ${t.TicketID})\n`;
            response += `   ${t.Title}\n`;
            response += `   Customer: ${t.CustomerID} | Status: ${t.State}\n\n`;
        });

        return {
            response,
            type: 'list'
        };
    }

    clearMemory(sessionId) {
        this.memory.delete(sessionId);
    }
}

const orchestrator = new AIOrchestrator();
export default orchestrator;