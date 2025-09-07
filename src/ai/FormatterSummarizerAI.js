// src/ai/FormatterSummarizerAI.js - Dynamic Response Formatting & Intelligent Summarization
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

class FormatterSummarizerAI {
    constructor() {
        this.model = new ChatOllama({
            temperature: 0.5, // Balanced creativity for formatting and summarization
            model: process.env.SUMMARIZATION_MODEL || 'mistral:7b',
            baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
        
        // Deep understanding of data structure for intelligent formatting
        this.structureKnowledge = `
        DATA STRUCTURE FOR FORMATTING:
        
        TICKET OBJECT FIELDS:
        - TicketID: Primary numeric identifier (e.g., 13001952)
        - TicketNumber: External string identifier (e.g., "2025082010043337")
        - Title: Ticket subject/title
        - CustomerID: Customer email address
        - State: Detailed status (new, open, pending reminder, closed successful, etc.)
        - StateType: Simplified status (new, open, pending, closed)
        - Priority: Text priority ("1 very low" to "5 very high") 
        - PriorityID: Numeric priority (1-5)
        - Queue: Department name (Customer Support, Technical Support, etc.)
        - Owner: Assigned agent username
        - Responsible: Responsible party username
        - Created: Creation date/time
        - Changed: Last modification date/time
        - Closed: Closure date/time (null if not closed)
        - Age: Age in seconds since creation
        - SolutionInMin: Resolution time in minutes (null if not resolved)
        
        ARTICLE/MESSAGE FIELDS:
        - ArticleID: Unique message identifier
        - ArticleNumber: Sequential number in conversation (1, 2, 3...)
        - Subject: Message subject line
        - Body: Full message content
        - From: Sender email/name
        - To: Recipient email/name
        - SenderType: "customer", "agent", or "system"
        - CreateTime: Message creation time
        - IsVisibleForCustomer: Whether customer can see (0/1)
        
        ATTACHMENT FIELDS:
        - Filename: Original file name
        - ContentType: MIME type
        - FilesizeRaw: File size in bytes
        - Disposition: "inline" or "attachment"
        `;
    }

    async formatQueryResults(queryResults, userMessage, formatInstruction, conversationContext, debugLog = () => {}) {
        debugLog("🎨 FormatterSummarizerAI formatting query results");
        
        const formatPrompt = ChatPromptTemplate.fromTemplate(`
        You are an expert at presenting data in exactly the way users want to see it.
        
        USER'S ORIGINAL MESSAGE: "{userMessage}"
        FORMAT INSTRUCTION: "{formatInstruction}"
        
        QUERY RESULTS:
        - Result Count: {resultCount}
        - Sample Data: {sampleData}
        
        CONVERSATION CONTEXT: {conversationContext}
        
        DATA STRUCTURE KNOWLEDGE:
        {structureKnowledge}
        
        YOUR TASK: Format the results EXACTLY as the user expects based on their request.
        
        INTELLIGENT FORMATTING RULES:
        
        1. ANALYZE WHAT USER WANTS:
        - "show all ticket IDs" → List just the TicketID numbers
        - "list tickets" → Show TicketID, Title, Customer, Status in clean format
        - "find tickets by email" → Show relevant tickets with customer focus
        - "show recent tickets" → Show with dates, newest first
        - "get ticket details" → Comprehensive information
        
        2. DYNAMIC PRESENTATION:
        - For 1 result: Show detailed information
        - For 2-10 results: Show key details in list format
        - For 10+ results: Show summarized list + offer to show more details
        - For 100+ results: Show stats + sample + suggest filtering
        
        3. USER-FRIENDLY FORMAT:
        - Use clear headers and structure
        - Bold important information like ticket numbers
        - Include relevant context (dates, status, priority)
        - Make it scannable and easy to read
        - Always include total count
        
        4. BE CONVERSATIONAL:
        - Don't just dump data
        - Explain what you're showing
        - Offer helpful next steps
        - Be natural and helpful
        
        5. HANDLE SPECIAL CASES:
        - No results: Be helpful, suggest alternatives
        - Too many results: Summarize and offer refinement
        - Single result: Show comprehensive details
        
        FORMATTING EXAMPLES:
        
        For "show all ticket IDs":
        "Here are all 25 Ticket IDs in your database:
        13001952, 13001953, 13001954, 13001955...
        
        Would you like details about any specific ticket?"
        
        For "list recent tickets":
        "Here are the 8 most recent tickets:
        
        1. **Ticket 13001952** (2025010610000001)
           📧 Customer: john@email.com
           📝 Issue: Login problems with new system
           ✅ Status: Open | 🔴 Priority: High
           📅 Created: Jan 6, 2025
        
        2. **Ticket 13001951** (2025010510000002)
           📧 Customer: jane@company.com
           📝 Issue: Password reset not working
           ✅ Status: Closed | 🟡 Priority: Normal
           📅 Created: Jan 5, 2025"
        
        For stats/counts:
        "Found 156 tickets total:
        - 45 Open (29%)
        - 89 Closed (57%) 
        - 22 Pending (14%)
        
        Top 3 customers by ticket count:
        1. support@bigcorp.com (12 tickets)
        2. admin@startup.com (8 tickets)
        3. help@agency.com (6 tickets)"
        
        CRITICAL:
        - Match user's expectation exactly
        - Don't show unnecessary fields unless requested
        - Use emojis and formatting for better readability
        - Always end with helpful next steps
        - Be natural and conversational
        
        Format the results:
        `);
        
        try {
            const sampleData = this.prepareSampleData(queryResults.results);
            
            const chain = formatPrompt.pipe(this.model).pipe(new StringOutputParser());
            
            const formattedResponse = await chain.invoke({
                userMessage,
                formatInstruction,
                resultCount: queryResults.resultCount,
                sampleData: JSON.stringify(sampleData, null, 2),
                conversationContext: JSON.stringify(conversationContext),
                structureKnowledge: this.structureKnowledge
            });
            
            return {
                success: true,
                formattedResponse,
                resultCount: queryResults.resultCount,
                type: 'formatted_results'
            };
            
        } catch (error) {
            debugLog("Formatting error:", error);
            return this.fallbackFormat(queryResults, userMessage);
        }
    }

    async createIntelligentSummary(summaryInstruction, tickets, userMessage, conversationContext, debugLog = () => {}) {
        debugLog("📋 FormatterSummarizerAI creating intelligent summary");
        
const summaryPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert at creating comprehensive, intelligent summaries of support tickets and conversations.

USER'S REQUEST: "{userMessage}"
SUMMARY INSTRUCTION: "{summaryInstruction}"

TICKET DATA TO SUMMARIZE:
{ticketData}

CONVERSATION CONTEXT: {conversationContext}

DATA STRUCTURE KNOWLEDGE:
{structureKnowledge}

IMPORTANT: 
- Create the summary strictly based on provided ticket data.
- Do NOT include any example tickets, placeholder information, or fabricated content.
- Avoid hallucinating details not found in the data.
- Match the user's request clearly and accurately.

SUMMARY TYPES:

1. SINGLE TICKET SUMMARY:
- Issue overview and context
- Customer and ticket details
- Complete conversation flow (who said what, when)
- Current status and resolution
- Key decisions and actions taken
- Timeline of events
- Attachments mentioned
- Next steps if still open

2. MULTIPLE TICKETS SUMMARY:
- Overall patterns and trends
- Common issues identified
- Customer satisfaction indicators
- Resolution times and efficiency
- Agent performance insights
- Priority distribution
- Status breakdown

3. CUSTOMER SUMMARY:
- Customer interaction history
- Common issues for this customer
- Resolution patterns
- Communication preferences
- Overall relationship health

4. TOPIC/KEYWORD SUMMARY:
- Thematic analysis of issues
- Frequency of specific problems
- Resolution strategies that work
- Time-to-resolution trends

SUMMARY QUALITY STANDARDS:

✅ COMPREHENSIVE: Cover all important aspects
✅ NARRATIVE: Tell the story, don't just list facts
✅ ACTIONABLE: Include insights and recommendations
✅ STRUCTURED: Use clear sections and headers
✅ CONTEXTUAL: Relate to user's specific request
✅ PROFESSIONAL: Business-appropriate tone
✅ ACCESSIBLE: Easy to understand and scan

FORMATTING GUIDELINES:
- Use markdown headers (##, ###) for structure
- Use bullet points for key facts
- Use **bold** for important information
- Include dates and times in context
- Use clear section breaks
- End with summary of key takeaways

Create the intelligent summary:
`);

        
        try {
            const ticketData = this.prepareTicketDataForSummary(tickets);
            
            const chain = summaryPrompt.pipe(this.model).pipe(new StringOutputParser());
            
            const summary = await chain.invoke({
                userMessage,
                summaryInstruction,
                ticketData: JSON.stringify(ticketData, null, 2),
                conversationContext: JSON.stringify(conversationContext),
                structureKnowledge: this.structureKnowledge
            });
            
            return {
                success: true,
                summary,
                ticketCount: tickets.length,
                type: 'intelligent_summary'
            };
            
        } catch (error) {
            debugLog("Summary creation error:", error);
            return this.fallbackSummary(tickets, userMessage);
        }
    }

    async detectAndCorrectFormatting(formattingResult, correctionInstructions, debugLog = () => {}) {
        debugLog("🔧 FormatterSummarizerAI correcting formatting");
        
        const correctionPrompt = ChatPromptTemplate.fromTemplate(`
        Fix the formatting based on correction instructions.
        
        ORIGINAL FORMATTING:
        {originalFormatting}
        
        CORRECTION INSTRUCTIONS:
        {correctionInstructions}
        
        STRUCTURE KNOWLEDGE:
        {structureKnowledge}
        
        Apply the corrections and improve the formatting:
        {{
            "correctedFormatting": "improved formatted response",
            "changesApplied": ["list of changes made"],
            "explanation": "why these changes improve the response"
        }}
        `);
        
        try {
            const chain = correctionPrompt.pipe(this.model).pipe(new StringOutputParser());
            
            const response = await chain.invoke({
                originalFormatting: JSON.stringify(formattingResult),
                correctionInstructions,
                structureKnowledge: this.structureKnowledge
            });
            
            const correction = JSON.parse(response.replace(/```json|```/g, '').trim());
            
            return {
                success: true,
                correctedFormatting: correction.correctedFormatting,
                changesApplied: correction.changesApplied,
                wasCorrected: true
            };
            
        } catch (error) {
            debugLog("Formatting correction failed:", error);
            return formattingResult; // Return original if correction fails
        }
    }

    prepareSampleData(results) {
        if (!results || results.length === 0) return null;
        
        // Show more samples for better formatting context
        const samples = results.slice(0, Math.min(5, results.length)).map(r => {
            const ticket = r.data.ticket;
            const articles = r.data.article || [];
            const attachments = r.data.attachment || [];
            
            return {
                ticketID: ticket.TicketID,
                ticketNumber: ticket.TicketNumber,
                title: ticket.Title,
                customer: ticket.CustomerID,
                state: ticket.State,
                stateType: ticket.StateType,
                priority: ticket.Priority,
                priorityID: ticket.PriorityID,
                queue: ticket.Queue,
                owner: ticket.Owner,
                created: ticket.Created,
                closed: ticket.Closed,
                messageCount: articles.length,
                attachmentCount: attachments.length,
                lastMessage: articles.length > 0 ? {
                    from: articles[articles.length - 1].From,
                    time: articles[articles.length - 1].CreateTime,
                    preview: articles[articles.length - 1].Body?.substring(0, 100)
                } : null
            };
        });
        
        // Also provide aggregate stats
        const stats = this.calculateStats(results);
        
        return {
            samples,
            totalCount: results.length,
            stats
        };
    }

    prepareTicketDataForSummary(tickets) {
        return tickets.map(ticket => {
            const t = ticket.data.ticket;
            const articles = ticket.data.article || [];
            const attachments = ticket.data.attachment || [];
            
            return {
                ticket: {
                    id: t.TicketID,
                    number: t.TicketNumber,
                    title: t.Title,
                    customer: t.CustomerID,
                    state: t.State,
                    priority: t.Priority,
                    queue: t.Queue,
                    owner: t.Owner,
                    created: t.Created,
                    closed: t.Closed,
                    solutionTime: t.SolutionInMin
                },
                conversation: articles.map(a => ({
                    from: a.From,
                    to: a.To,
                    subject: a.Subject,
                    body: a.Body,
                    time: a.CreateTime,
                    senderType: a.SenderType,
                    visible: a.IsVisibleForCustomer === 1
                })),
                attachments: attachments.map(att => ({
                    filename: att.Filename,
                    size: att.FilesizeRaw,
                    type: att.ContentType
                }))
            };
        });
    }

    calculateStats(results) {
        const stats = {
            total: results.length,
            byStatus: {},
            byPriority: {},
            byQueue: {},
            avgMessageCount: 0,
            withAttachments: 0
        };
        
        let totalMessages = 0;
        
        results.forEach(r => {
            const ticket = r.data.ticket;
            const articles = r.data.article || [];
            const attachments = r.data.attachment || [];
            
            // Count by status
            stats.byStatus[ticket.StateType] = (stats.byStatus[ticket.StateType] || 0) + 1;
            
            // Count by priority
            stats.byPriority[ticket.Priority] = (stats.byPriority[ticket.Priority] || 0) + 1;
            
            // Count by queue
            stats.byQueue[ticket.Queue] = (stats.byQueue[ticket.Queue] || 0) + 1;
            
            // Message count
            totalMessages += articles.length;
            
            // Attachments
            if (attachments.length > 0) stats.withAttachments++;
        });
        
        stats.avgMessageCount = results.length > 0 ? Math.round(totalMessages / results.length) : 0;
        
        return stats;
    }

    fallbackFormat(queryResults, userMessage) {
        const results = queryResults.results || [];
        
        if (results.length === 0) {
            return {
                success: true,
                formattedResponse: "No tickets found matching your criteria. Try adjusting your search terms or ask to 'show all tickets' to see everything available.",
                resultCount: 0,
                type: 'no_results'
            };
        }
        
        let response = `Found ${results.length} ticket(s):\n\n`;
        
        results.slice(0, 10).forEach((r, i) => {
            const t = r.data.ticket;
            response += `${i + 1}. **Ticket ${t.TicketID}** (${t.TicketNumber})\n`;
            response += `   📝 ${t.Title}\n`;
            response += `   📧 ${t.CustomerID}\n`;
            response += `   ✅ ${t.State} | Priority: ${t.Priority}\n\n`;
        });
        
        if (results.length > 10) {
            response += `... and ${results.length - 10} more tickets.\n\nWould you like me to show more details or help you filter these results?`;
        }
        
        return {
            success: true,
            formattedResponse: response,
            resultCount: results.length,
            type: 'fallback_format'
        };
    }

    fallbackSummary(tickets, userMessage) {
        if (!tickets || tickets.length === 0) {
            return {
                success: false,
                summary: "No tickets available to summarize. Please specify a ticket ID or show some tickets first.",
                ticketCount: 0,
                type: 'no_summary'
            };
        }
        
        const ticket = tickets[0];
        const t = ticket.data.ticket;
        const articles = ticket.data.article || [];
        
        const summary = `## Summary of Ticket ${t.TicketID}

**Customer**: ${t.CustomerID}
**Status**: ${t.State}
**Priority**: ${t.Priority}
**Created**: ${t.Created}

**Issue**: ${t.Title}

**Messages**: ${articles.length} messages in conversation

This is a basic summary. The system encountered an issue generating a detailed summary.`;
        
        return {
            success: true,
            summary,
            ticketCount: tickets.length,
            type: 'fallback_summary'
        };
    }
}

export default FormatterSummarizerAI;