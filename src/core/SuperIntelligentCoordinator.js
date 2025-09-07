// src/core/SuperIntelligentCoordinator-WithMemory.js
import SuperIntelligentConversationalAI from '../ai/SuperIntelligentConversationalAI.js';
import SuperIntelligentDatabaseQueryAI from '../ai/SuperIntelligentDatabaseQueryAI.js';
import FormatterSummarizerAI from '../ai/FormatterSummarizerAI.js';
import conversationMemory from '../services/conversationMemory.js';
import mongoConnection from '../db/mongodb.js';

class SuperIntelligentCoordinator {
    constructor() {
        this.conversationalAI = new SuperIntelligentConversationalAI();
        this.databaseQueryAI = new SuperIntelligentDatabaseQueryAI();
        this.formatterSummarizerAI = new FormatterSummarizerAI();
        this.maxRetries = 3;
        this.debugMode = process.env.DEBUG_ENABLED === 'true';
        
        console.log('🧠 SuperIntelligent Coordinator initialized - WITH MEMORY CONTINUATION SUPPORT');
    }

    async processUserMessage(message, sessionId, debugLog = console.log) {
        if (this.debugMode) debugLog(`🧠 SuperIntelligent processing: "${message}"`);
        
        const startTime = Date.now();
        
        try {
            // Initialize database connection
            await mongoConnection.connect();
            
            // Get conversation context and memory
            const conversationContext = conversationMemory.getContext(sessionId);
            
            // Step 1: SuperIntelligent ConversationalAI analyzes the user message
            const decision = await this.conversationalAI.analyzeUserRequest(
                message,
                conversationContext,
                debugLog
            );
            
            if (this.debugMode) debugLog("🎯 SuperIntelligent Decision:", decision);
            
            let processingResults = {
                decision,
                success: true,
                data: null,
                error: null
            };
            
            // Step 2: Execute based on intelligent decision
            if (decision.action === 'chat' || decision.action === 'explain') {
                // Direct conversational response
                processingResults.data = {
                    type: 'conversation',
                    response: decision.conversationResponse || this.generateExplanationResponse(),
                    success: true
                };
                
            } else if (decision.action === 'continue_query') {
                // *** NEW: Handle continuation requests ***
                debugLog("🔄 Processing continuation request");
                processingResults.data = await this.executeContinuation(
                    decision,
                    message,
                    conversationContext,
                    debugLog
                );
                
            } else if (decision.action === 'query' && decision.needsData) {
                // Execute super intelligent database query
                debugLog("🔍 Executing database query with FIXED AI");
                processingResults.data = await this.executeSuperIntelligentQuery(
                    decision.queryInstruction,
                    message,
                    conversationContext,
                    debugLog
                );
                
            } else if (decision.action === 'summarize') {
                // Execute intelligent summarization
                processingResults.data = await this.executeSummarization(
                    decision.summaryInstruction,
                    message,
                    conversationContext,
                    debugLog
                );
            }
            
            // Step 3: Generate super intelligent final response
            const finalResponse = await this.conversationalAI.generateFinalResponse(
                message,
                processingResults,
                conversationContext,
                debugLog
            );
            
            // Step 4: Update conversation memory with intelligence
            this.updateConversationMemory(
                sessionId,
                message,
                decision,
                processingResults,
                finalResponse
            );
            
            const processingTime = Date.now() - startTime;
            if (this.debugMode) debugLog(`✅ SuperIntelligent processing completed in ${processingTime}ms`);
            
            return {
                response: finalResponse,
                sessionId,
                processingTime,
                resultCount: processingResults.data?.resultCount || 0,
                intelligenceLevel: 'Super',
                debug: this.debugMode ? {
                    decision,
                    processingResults
                } : undefined
            };
            
        } catch (error) {
            if (this.debugMode) debugLog("❌ SuperIntelligent Coordinator error:", error);
            return await this.handleCriticalError(error, message, sessionId, debugLog);
        }
    }

    // *** NEW METHOD: Handle continuation requests ***
    async executeContinuation(decision, userMessage, conversationContext, debugLog) {
        debugLog("🔄 Executing continuation request");
        
        const continuationData = decision.continuationData;
        const lastResults = continuationData.lastResults || [];
        const currentOffset = continuationData.offset || 20;
        
        if (lastResults.length === 0) {
            return {
                type: 'error',
                response: "I don't have any previous results to continue from. Please ask me to find some data first.",
                success: false,
                intelligenceLevel: 'Super'
            };
        }
        
        // Determine how many more results to show
        const pageSize = 20; // Show 20 more results at a time
        const remainingResults = lastResults.slice(currentOffset);
        const nextBatch = remainingResults.slice(0, pageSize);
        
        if (nextBatch.length === 0) {
            return {
                type: 'continuation_results',
                response: `You've seen all ${lastResults.length} results! There are no more tickets to display.`,
                resultCount: 0,
                success: true,
                intelligenceLevel: 'Super'
            };
        }
        
        // Create continuation response showing more results
        const continuationResponse = this.createContinuationResponse(
            nextBatch,
            currentOffset,
            lastResults.length,
            userMessage,
            debugLog
        );
        
        // Update the conversation context with new offset
        conversationContext.lastOffset = currentOffset + nextBatch.length;
        
        return continuationResponse;
    }

    createContinuationResponse(results, startIndex, totalResults, userMessage, debugLog) {
        debugLog(`📊 Creating continuation response for ${results.length} results (${startIndex + 1}-${startIndex + results.length} of ${totalResults})`);
        
        const endIndex = startIndex + results.length;
        let response = `**Continuing results (${startIndex + 1}-${endIndex} of ${totalResults} total):**\n\n`;
        
        // Check if this was originally a ticket ID request
        const wantsTicketIds = userMessage.toLowerCase().includes('ticketid') || 
                             userMessage.toLowerCase().includes('ticket id') ||
                             userMessage.toLowerCase().includes('list') && userMessage.toLowerCase().includes('id');
        
        if (wantsTicketIds) {
            // For ticket ID requests, show only the IDs
            const ticketIds = results.map(r => r.data?.ticket?.TicketID).filter(id => id);
            
            if (ticketIds.length > 0) {
                response = `**More Ticket IDs (${startIndex + 1}-${endIndex} of ${totalResults} total):**\n\n${ticketIds.join(', ')}\n\n`;
            }
        } else {
            // For general ticket lists, show formatted results
            results.forEach((r, i) => {
                const ticket = r.data?.ticket;
                if (ticket) {
                    response += `${startIndex + i + 1}. **Ticket ${ticket.TicketID}** (${ticket.TicketNumber || 'No Number'})\n`;
                    response += `   📝 ${ticket.Title || 'No Title'}\n`;
                    response += `   📧 ${ticket.CustomerID || 'No Customer'}\n`;
                    response += `   ✅ ${ticket.State || 'Unknown Status'}\n\n`;
                }
            });
        }
        
        // Add continuation prompt
        const remaining = totalResults - endIndex;
        if (remaining > 0) {
            response += `**${remaining} more results available.**\nSay "see more" to continue, or ask me to filter or search the results.`;
        } else {
            response += `**That's all ${totalResults} results!**\nWould you like me to help you search or filter these tickets?`;
        }
        
        return {
            type: 'continuation_results',
            response: response,
            resultCount: results.length,
            success: true,
            intelligenceLevel: 'Super',
            pagination: {
                currentStart: startIndex + 1,
                currentEnd: endIndex,
                total: totalResults,
                remaining: remaining,
                hasMore: remaining > 0
            }
        };
    }

    async executeSuperIntelligentQuery(queryInstruction, userMessage, conversationContext, debugLog, retryCount = 0) {
        if (this.debugMode) debugLog(`🔍 Executing query (attempt ${retryCount + 1}): ${queryInstruction}`);
        
        try {
            // Call the DatabaseQueryAI
            const queryResult = await this.databaseQueryAI.buildPerfectQuery(
                queryInstruction,
                userMessage,
                conversationContext,
                debugLog
            );
            
            if (queryResult.success) {
                // Create response directly here instead of using FormatterSummarizerAI
                const directResponse = this.createDirectQueryResponse(queryResult, userMessage, debugLog);
                
                if (directResponse) {
                    // *** IMPORTANT: Store results AND reset offset for new queries ***
                    conversationContext.lastResults = queryResult.results;
                    conversationContext.lastQuery = queryResult.query;
                    conversationContext.lastOffset = 0; // Reset offset for new query
                    
                    return directResponse;
                } else {
                    // Fallback to formatter if direct response fails
                    return this.createSimpleQueryResponse(queryResult, userMessage);
                }
            } else {
                // Query failed, try intelligent correction
                return await this.handleQueryErrorIntelligently(queryResult, queryInstruction, userMessage, conversationContext, debugLog, retryCount);
            }
            
        } catch (error) {
            if (retryCount < this.maxRetries) {
                debugLog(`❌ Query attempt ${retryCount + 1} failed, retrying intelligently...`);
                return await this.executeSuperIntelligentQuery(queryInstruction, userMessage, conversationContext, debugLog, retryCount + 1);
            } else {
                return {
                    type: 'error',
                    response: `I've applied maximum intelligence to your query "${userMessage}" but encountered persistent issues. The database might be temporarily unavailable. Please try rephrasing your request or try again in a moment.`,
                    success: false,
                    error: error.message,
                    intelligenceLevel: 'Super'
                };
            }
        }
    }

    // *** ENHANCED: Show limited results with continuation option ***
    createDirectQueryResponse(queryResult, userMessage, debugLog) {
        const results = queryResult.results || [];
        const resultCount = queryResult.resultCount || results.length;
        
        debugLog(`📊 Creating direct response for ${resultCount} results`);
        
        if (resultCount === 0) {
            return {
                type: 'query_results',
                response: "No results found in the database. The database might be empty or your search criteria didn't match any records.",
                resultCount: 0,
                success: true,
                intelligenceLevel: 'Super'
            };
        }
        
        // Check if user specifically wanted ticket IDs
        const wantsTicketIds = userMessage.toLowerCase().includes('ticketid') || 
                             userMessage.toLowerCase().includes('ticket id') ||
                             userMessage.toLowerCase().includes('list') && userMessage.toLowerCase().includes('id');
        
        if (wantsTicketIds) {
            const ticketIds = results.map(r => r.data?.ticket?.TicketID).filter(id => id);
            
            if (ticketIds.length > 0) {
                // Show limited results with continuation option
                const displayLimit = 50; // Show more ticket IDs since they're compact
                const visibleIds = ticketIds.slice(0, displayLimit);
                const hasMore = ticketIds.length > displayLimit;
                
                let response = `**All Ticket IDs (${ticketIds.length} total):**\n\n${visibleIds.join(', ')}`;
                
                if (hasMore) {
                    const remaining = ticketIds.length - displayLimit;
                    response += `\n\n**Showing first ${displayLimit} of ${ticketIds.length} total ticket IDs.**\n${remaining} more available - say "see more" to continue.`;
                } else {
                    response += `\n\nWould you like details about any specific tickets?`;
                }
                
                return {
                    type: 'query_results',
                    response: response,
                    resultCount: ticketIds.length,
                    query: queryResult.query,
                    success: true,
                    intelligenceLevel: 'Super'
                };
            }
        }
        
        // For other types of queries, show first 20 results with option for more
        const displayLimit = 20;
        const visibleResults = results.slice(0, displayLimit);
        const hasMore = results.length > displayLimit;
        
        let response = `**Found ${resultCount} result(s):**\n\n`;
        
        visibleResults.forEach((r, i) => {
            const ticket = r.data?.ticket;
            if (ticket) {
                response += `${i + 1}. **Ticket ${ticket.TicketID}** (${ticket.TicketNumber || 'No Number'})\n`;
                response += `   📝 ${ticket.Title || 'No Title'}\n`;
                response += `   📧 ${ticket.CustomerID || 'No Customer'}\n`;
                response += `   ✅ ${ticket.State || 'Unknown Status'}\n\n`;
            }
        });
        
        if (hasMore) {
            const remaining = resultCount - displayLimit;
            response += `**Showing first ${displayLimit} of ${resultCount} total results.**\n${remaining} more available - say "see more" to continue.`;
        }
        
        return {
            type: 'query_results',
            response: response,
            resultCount: resultCount,
            query: queryResult.query,
            success: true,
            intelligenceLevel: 'Super'
        };
    }

    async handleQueryErrorIntelligently(queryResult, queryInstruction, userMessage, conversationContext, debugLog, retryCount) {
        if (retryCount >= this.maxRetries) {
            // If we have fallback results, use them
            if (queryResult.fallbackResults && queryResult.fallbackResults.length > 0) {
                return this.createSimpleQueryResponse({
                    results: queryResult.fallbackResults,
                    resultCount: queryResult.fallbackResults.length,
                    success: true
                }, userMessage, true);
            }
            
            return {
                type: 'error',
                response: "I've tried multiple intelligent approaches but couldn't execute your query. Please try rephrasing your request.",
                success: false,
                intelligenceLevel: 'Super'
            };
        }
        
        if (this.debugMode) debugLog("🔧 Handling query error with super intelligence...");
        
        // Try correction using the fixed AI
        try {
            const correctedResult = await this.databaseQueryAI.correctFailedQuery(
                queryResult.query || {},
                queryResult.error || "Unknown error",
                "Simplify query and remove problematic operators",
                debugLog
            );
            
            if (correctedResult.success) {
                return this.createSimpleQueryResponse(correctedResult, userMessage, false, true);
            }
        } catch (correctionError) {
            debugLog("Query correction also failed:", correctionError);
        }
        
        // If we have fallback results, use them
        if (queryResult.fallbackResults && queryResult.fallbackResults.length > 0) {
            return this.createSimpleQueryResponse({
                results: queryResult.fallbackResults,
                resultCount: queryResult.fallbackResults.length,
                success: true
            }, userMessage, true);
        }
        
        return {
            type: 'error',
            response: "I couldn't execute your query with super intelligence. Could you try rephrasing it?",
            success: false,
            intelligenceLevel: 'Super'
        };
    }

    createSimpleQueryResponse(queryResult, userMessage, wasFallback = false, wasCorrected = false) {
        const results = queryResult.results || [];
        const resultCount = queryResult.resultCount || results.length;
        
        if (resultCount === 0) {
            return {
                type: 'query_results',
                response: "No results found in the database. The database might be empty or your search criteria didn't match any records.",
                resultCount: 0,
                success: true,
                intelligenceLevel: 'Super'
            };
        }
        
        // Check if user wanted ticket IDs specifically
        if (userMessage.toLowerCase().includes('ticketid') || userMessage.toLowerCase().includes('ticket id')) {
            const ticketIds = results.map(r => r.data?.ticket?.TicketID).filter(id => id);
            
            if (ticketIds.length > 0) {
                const prefix = wasFallback ? "Using intelligent fallback, here are the " : 
                              wasCorrected ? "After intelligent correction, here are the " : 
                              "Here are all the ";
                              
                // Show ALL ticket IDs - NO TRUNCATION
                const allTicketIds = ticketIds.join(', ');
                              
                return {
                    type: 'query_results',
                    response: `${prefix}**Ticket IDs (${ticketIds.length} total):**\n\n${allTicketIds}\n\nWould you like details about any specific tickets?`,
                    resultCount: ticketIds.length,
                    success: true,
                    intelligenceLevel: 'Super'
                };
            }
        }
        
        // General response for other queries
        let response = `Found ${resultCount} result(s):\n\n`;
        
        results.slice(0, 10).forEach((r, i) => {
            const ticket = r.data?.ticket;
            if (ticket) {
                response += `${i + 1}. **Ticket ${ticket.TicketID}** (${ticket.TicketNumber || 'No Number'})\n`;
                response += `   📝 ${ticket.Title || 'No Title'}\n`;
                response += `   📧 ${ticket.CustomerID || 'No Customer'}\n`;
                response += `   ✅ ${ticket.State || 'Unknown Status'}\n\n`;
            }
        });
        
        if (resultCount > 10) {
            response += `... and ${resultCount - 10} more results.`;
        }
        
        const prefix = wasFallback ? "Using intelligent fallback:\n\n" : 
                      wasCorrected ? "After intelligent correction:\n\n" : "";
                      
        return {
            type: 'query_results',
            response: prefix + response,
            resultCount: resultCount,
            success: true,
            intelligenceLevel: 'Super'
        };
    }

    async executeSummarization(summaryInstruction, userMessage, conversationContext, debugLog) {
        if (this.debugMode) debugLog(`📋 Executing super intelligent summarization: ${summaryInstruction}`);
        
        try {
            // Simple summarization logic
            let ticketsToSummarize = [];
            
            // Check if specific ticket ID mentioned
            const ticketIdMatches = userMessage.match(/\d{7,}/g);
            if (ticketIdMatches) {
                for (const idStr of ticketIdMatches) {
                    const ticketId = parseInt(idStr);
                    try {
                        const queryResult = await this.databaseQueryAI.buildPerfectQuery(
                            `Find ticket with ID ${ticketId}`,
                            userMessage,
                            conversationContext,
                            debugLog
                        );
                        
                        if (queryResult.success && queryResult.results.length > 0) {
                            ticketsToSummarize.push(...queryResult.results);
                        }
                    } catch (error) {
                        debugLog("Error finding ticket for summarization:", error);
                    }
                }
            } else if (conversationContext.lastResults && conversationContext.lastResults.length > 0) {
                // Use last query results intelligently
                ticketsToSummarize = conversationContext.lastResults.slice(0, 3);
            }
            
            if (ticketsToSummarize.length === 0) {
                return {
                    type: 'error',
                    response: "I need to know which ticket(s) to summarize. Please provide a ticket ID or show some tickets first.",
                    success: false,
                    intelligenceLevel: 'Super'
                };
            }
            
            // Create summary using the formatter
            const summaryResult = await this.formatterSummarizerAI.createIntelligentSummary(
                summaryInstruction,
                ticketsToSummarize,
                userMessage,
                conversationContext,
                debugLog
            );
            
            if (summaryResult.success) {
                return {
                    type: 'summary',
                    response: summaryResult.summary,
                    ticketCount: summaryResult.ticketCount,
                    success: true,
                    intelligenceLevel: 'Super'
                };
            } else {
                return {
                    type: 'error',
                    response: "I couldn't generate the intelligent summary. Please try a different approach.",
                    success: false,
                    intelligenceLevel: 'Super'
                };
            }
            
        } catch (error) {
            debugLog("❌ Summarization error:", error);
            return {
                type: 'error',
                response: "I encountered an issue while creating the summary. Please try again.",
                success: false,
                error: error.message,
                intelligenceLevel: 'Super'
            };
        }
    }

    generateExplanationResponse() {
        return `🤖 **I'm your Super Intelligent Ticket Database Assistant!**

I have **complete mastery** of your database and can handle ANY request:

🔍 **Super Intelligent Data Queries**:
• "list all ticket IDs" - I'll get every ticket ID efficiently
• "find tickets from john@email.com" - Perfect customer search
• "show open tickets" - Smart status filtering
• "search for login issues" - Intelligent text search
• "how many high priority tickets" - Smart counting
• "tickets created today" - Date-based searches

📊 **Complete Database Knowledge**:
• **Tickets**: ID, Number, Title, Customer, Status, Priority, Queue, Dates
• **Messages**: Full conversation history with content and senders
• **Attachments**: Files, sizes, types attached to messages

📋 **Intelligent Summarization**:
• "summarize ticket 12345" - Comprehensive analysis
• "tell me about recent interactions" - Smart summaries

🧠 **Super Intelligence Features**:
• **No Missed Requests** - I understand every database query
• **Dynamic Responses** - Adapt to exactly what you want
• **Context Awareness** - Remember our conversation
• **Error Recovery** - Fix issues automatically
• **Continuation Support** - Say "see more" to continue results

Just ask me anything naturally! I'll handle it with super intelligence.`;
    }

    async handleCriticalError(error, message, sessionId, debugLog) {
        debugLog("💥 Critical error in SuperIntelligent Coordinator:", error);
        
        return {
            response: `I encountered a critical error while applying super intelligence: ${error.message}. Please try again or rephrase your request.`,
            sessionId,
            error: error.message,
            success: false,
            intelligenceLevel: 'Super'
        };
    }

    updateConversationMemory(sessionId, userMessage, decision, processingResults, finalResponse) {
        try {
            conversationMemory.addInteraction(sessionId, {
                userMessage,
                intent: decision,
                response: finalResponse,
                queryExecuted: processingResults.data?.query || null,
                resultsFound: processingResults.data?.resultCount || 0,
                timestamp: new Date(),
                success: processingResults.success,
                intelligenceLevel: 'Super'
            });
            
            // Store last results for intelligent follow-up queries
            const context = conversationMemory.getContext(sessionId);
            if (processingResults.data?.results) {
                context.lastResults = processingResults.data.results;
                context.lastQuery = processingResults.data.query;
                context.lastOffset = 0; // Reset for new queries
            }
            
            // Update context for next intelligent interaction
            context.lastAction = decision.action;
            context.lastIntelligenceLevel = 'Super';
            
        } catch (error) {
            if (this.debugMode) console.log("Memory update error:", error);
        }
    }

    // Method to clear session memory
    clearSession(sessionId) {
        conversationMemory.conversations.delete(sessionId);
    }

    // Method to get session status with intelligence info
    getSessionStatus(sessionId) {
        const context = conversationMemory.getContext(sessionId);
        return {
            sessionId,
            messageCount: context.history.length,
            lastActivity: context.lastActivity,
            hasResults: (context.lastResults || []).length > 0,
            lastAction: context.lastAction,
            intelligenceLevel: context.lastIntelligenceLevel || 'Super'
        };
    }
}

export default SuperIntelligentCoordinator;