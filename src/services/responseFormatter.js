// src/services/responseFormatter.js - Dynamic response formatting
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const formatterModel = new ChatOllama({
    temperature: 0.5,
    maxRetries: 2,
    model: process.env.CONVERSATION_MODEL || 'gemma:2b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

class ResponseFormatter {
    async formatResponse(intent, results, conversationHistory, debugLog) {
        debugLog("🎨 Formatting response dynamically...");
        
        const formatPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert at formatting customer service data responses. Create a natural, helpful response.

User Intent: {intent}
Results Found: {resultCount}
Data Sample: {dataSample}
Conversation History: {history}

CRITICAL FORMATTING RULES:
1. Match the user's expected format from their request
2. If they want a list → bullet points with key details
3. If they want a summary → paragraph form with highlights
4. If they want a table → structured data presentation
5. If they want details → comprehensive information
6. If they want statistics → numbers and percentages
7. Always use **bold** for ticket numbers and important data
8. Be conversational but professional

Response Types Based on Intent:
- "show me" / "list" → Clean formatted list
- "summarize" → Narrative summary
- "how many" / "count" → Statistics focused
- "find" / "search" → Results with relevance
- "analyze" → Insights and patterns
- "compare" → Side-by-side comparison

For NO RESULTS: Be helpful, suggest alternatives, mention what was searched.
For SINGLE RESULT: Provide comprehensive details.
For MULTIPLE RESULTS: Organize logically (by date, priority, status, etc.)

IMPORTANT: 
- Never return raw JSON or data structures
- Always make it human-readable
- Include relevant metadata (dates, status, priority)
- Mention total count if multiple results
- Be specific about what was searched

Create the formatted response:
`);

        try {
            // Prepare data sample for formatting
            const dataSample = this.prepareDataSample(results);
            
            const chain = formatPrompt.pipe(formatterModel).pipe(new StringOutputParser());
            const formattedResponse = await chain.invoke({
                intent: JSON.stringify(intent),
                resultCount: results.length,
                dataSample: JSON.stringify(dataSample),
                history: JSON.stringify(conversationHistory || {})
            });
            
            return {
                response: formattedResponse,
                type: this.determineResponseType(intent, results),
                metadata: {
                    totalResults: results.length,
                    queryType: intent.action,
                    hasMore: results.length > 20
                }
            };
        } catch (error) {
            debugLog("❌ Error formatting response:", error);
            return this.fallbackFormatter(intent, results);
        }
    }

    prepareDataSample(results) {
        if (!results || results.length === 0) {
            return null;
        }
        
        // For single result, provide full details
        if (results.length === 1) {
            const ticket = results[0].data.ticket;
            const articles = results[0].data.article || [];
            return {
                ticket: {
                    number: ticket.TicketNumber,
                    title: ticket.Title,
                    customer: ticket.CustomerID,
                    status: ticket.State,
                    priority: ticket.Priority,
                    queue: ticket.Queue,
                    created: ticket.Created,
                    messageCount: articles.length
                },
                firstMessage: articles[0]?.Body?.substring(0, 200),
                lastMessage: articles[articles.length - 1]?.Body?.substring(0, 200)
            };
        }
        
        // For multiple results, provide overview
        return {
            count: results.length,
            samples: results.slice(0, 3).map(r => ({
                number: r.data.ticket.TicketNumber,
                title: r.data.ticket.Title,
                status: r.data.ticket.State,
                customer: r.data.ticket.CustomerID
            })),
            stats: this.calculateStats(results)
        };
    }

    calculateStats(results) {
        const stats = {
            total: results.length,
            byStatus: {},
            byQueue: {},
            byPriority: {}
        };
        
        results.forEach(r => {
            const ticket = r.data.ticket;
            
            // Count by status
            stats.byStatus[ticket.State] = (stats.byStatus[ticket.State] || 0) + 1;
            
            // Count by queue
            stats.byQueue[ticket.Queue] = (stats.byQueue[ticket.Queue] || 0) + 1;
            
            // Count by priority
            stats.byPriority[ticket.Priority] = (stats.byPriority[ticket.Priority] || 0) + 1;
        });
        
        return stats;
    }

    determineResponseType(intent, results) {
        if (results.length === 0) return 'no_results';
        if (results.length === 1) return 'single_result';
        if (intent.action === 'summarize') return 'summary';
        if (intent.action === 'analyze') return 'analysis';
        if (intent.responseFormat === 'count') return 'statistics';
        return 'list_results';
    }

    fallbackFormatter(intent, results) {
        if (results.length === 0) {
            return {
                response: "I couldn't find any conversations matching your criteria. Try adjusting your search terms or timeframe.",
                type: 'no_results',
                metadata: { totalResults: 0 }
            };
        }
        
        const response = [`Found ${results.length} result(s):\n`];
        
        results.slice(0, 10).forEach(r => {
            const ticket = r.data.ticket;
            response.push(`• **${ticket.TicketNumber}** - ${ticket.Title}`);
            response.push(`  Customer: ${ticket.CustomerID} | Status: ${ticket.State} | Queue: ${ticket.Queue}`);
        });
        
        if (results.length > 10) {
            response.push(`\n... and ${results.length - 10} more results.`);
        }
        
        return {
            response: response.join('\n'),
            type: 'list_results',
            metadata: { totalResults: results.length }
        };
    }

    async formatErrorResponse(error, userMessage) {
        const errorMessages = {
            'no_database': "I'm having trouble connecting to the conversation database. Please try again in a moment.",
            'invalid_query': "I couldn't understand that request. Could you rephrase it differently?",
            'timeout': "The search is taking longer than expected. Try narrowing your search criteria.",
            'default': "I encountered an issue processing your request. Please try again or rephrase your question."
        };
        
        const errorType = this.classifyError(error);
        
        return {
            response: errorMessages[errorType] || errorMessages.default,
            type: 'error',
            error: process.env.DEBUG_ENABLED === 'true' ? error.message : undefined,
            suggestions: [
                "Try being more specific with ticket numbers or customer emails",
                "Use clear time references like 'yesterday' or 'last week'",
                "Specify if you want to search by ticket ID or ticket number"
            ]
        };
    }

    classifyError(error) {
        const errorString = error.toString().toLowerCase();
        if (errorString.includes('mongo') || errorString.includes('database')) return 'no_database';
        if (errorString.includes('timeout')) return 'timeout';
        if (errorString.includes('invalid') || errorString.includes('parse')) return 'invalid_query';
        return 'default';
    }
}

const responseFormatter = new ResponseFormatter();
export default responseFormatter;