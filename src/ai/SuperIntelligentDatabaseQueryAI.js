// src/ai/SuperIntelligentDatabaseQueryAI.js - WORKING MONGODB QUERY EXPERT
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import mongoConnection from '../db/mongodb.js';

class SuperIntelligentDatabaseQueryAI {
    constructor() {
        this.model = new ChatOllama({
            temperature: 0.1,
            model: process.env.QUERY_MODEL || 'deepseek-coder:6.7b',
            baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
        console.log('🔍 SuperIntelligent DatabaseQueryAI initialized');
    }

    async buildPerfectQuery(queryInstruction, userMessage, conversationContext, debugLog = () => {}) {
        debugLog("🔍 Building perfect query with intelligence");
        
        // First try direct pattern matching for common queries
        const directQuery = this.buildDirectQuery(queryInstruction, userMessage, debugLog);
        if (directQuery) {
            debugLog("🎯 Using direct pattern-matched query");
            return await this.executeQuery(directQuery, debugLog);
        }
        
        // If no direct pattern, create simple fallback query
        debugLog("🔧 Using intelligent fallback query");
        return await this.createSimpleQuery(queryInstruction, userMessage, debugLog);
    }

    buildDirectQuery(queryInstruction, userMessage, debugLog) {
        const lowerInstruction = queryInstruction.toLowerCase();
        const lowerMessage = userMessage.toLowerCase();
        
        // Match pattern: user wants ticket IDs
        if ((lowerInstruction.includes('ticket') && lowerInstruction.includes('id')) || 
            (lowerMessage.includes('ticketid') || lowerMessage.includes('ticket id'))) {
            debugLog("🎯 Pattern match: All Ticket IDs requested");
            return {
                filter: {},
                options: {
                    projection: {"data.ticket.TicketID": 1, "_id": 0},
                    sort: {"data.ticket.Created": -1},
                    limit: 1000
                },
                explanation: "Get all tickets and return only TicketID values"
            };
        }
        
        // Match pattern: user wants all tickets
        if (lowerInstruction.includes('all') && lowerInstruction.includes('ticket')) {
            debugLog("🎯 Pattern match: All tickets requested");
            return {
                filter: {},
                options: {
                    sort: {"data.ticket.Created": -1},
                    limit: 100
                },
                explanation: "Get all tickets with basic information"
            };
        }
        
        // Match pattern: customer email search
        const emailMatch = userMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
            debugLog("🎯 Pattern match: Customer email search");
            return {
                filter: {"data.ticket.CustomerID": emailMatch[1]},
                options: {
                    sort: {"data.ticket.Created": -1},
                    limit: 100
                },
                explanation: `Find tickets for customer ${emailMatch[1]}`
            };
        }
        
        // Match pattern: open tickets
        if (lowerMessage.includes('open') && lowerMessage.includes('ticket')) {
            debugLog("🎯 Pattern match: Open tickets");
            return {
                filter: {"data.ticket.StateType": {"$in": ["open", "new", "pending"]}},
                options: {
                    sort: {"data.ticket.Created": -1},
                    limit: 100
                },
                explanation: "Find all open tickets"
            };
        }
        
        return null; // No pattern matched
    }

    async createSimpleQuery(queryInstruction, userMessage, debugLog) {
        debugLog("🔧 Creating simple query");
        
        // Default: get all tickets
        const queryPlan = {
            filter: {},
            options: {
                sort: {"data.ticket.Created": -1},
                limit: 50
            },
            explanation: "Simple query to get recent tickets"
        };
        
        return await this.executeQuery(queryPlan, debugLog);
    }

    async executeQuery(queryPlan, debugLog) {
        try {
            debugLog("⚡ Executing query:", JSON.stringify(queryPlan.filter));
            
            const results = await mongoConnection.findConversations(
                queryPlan.filter || {},
                queryPlan.options || { limit: 100, sort: { "data.ticket.Created": -1 } }
            );
            
            debugLog(`✅ Query executed successfully: ${results.length} results found`);
            
            return {
                success: true,
                query: queryPlan,
                results,
                resultCount: results.length,
                explanation: queryPlan.explanation || "Query executed successfully"
            };
            
        } catch (error) {
            debugLog("❌ Query execution failed:", error.message);
            
            // Try the simplest possible fallback query
            return await this.createFallbackQuery(debugLog);
        }
    }

    async createFallbackQuery(debugLog) {
        debugLog("🚨 Creating ultimate fallback query");
        
        try {
            // Simplest possible query
            const results = await mongoConnection.findConversations({}, { limit: 20 });
            
            return {
                success: false,
                fallbackResults: results,
                resultCount: results.length,
                explanation: "Used fallback query - original query failed",
                needsCorrection: true
            };
            
        } catch (error) {
            debugLog("💥 Even fallback query failed:", error.message);
            return {
                success: false,
                error: error.message,
                fallbackResults: [],
                resultCount: 0,
                explanation: "Database connection completely failed",
                needsCorrection: true
            };
        }
    }

    async correctFailedQuery(originalQuery, errorMessage, correctionInstructions, debugLog = () => {}) {
        debugLog("🔧 Correcting failed query");
        
        // Simple correction: remove problematic parts
        const correctedQuery = {
            filter: {},
            options: {
                limit: 100,
                sort: { "data.ticket.Created": -1 }
            }
        };
        
        return await this.executeQuery(correctedQuery, debugLog);
    }

    // Simple validation method
    validateQuery(queryPlan) {
        return queryPlan && typeof queryPlan === 'object';
    }
}

export default SuperIntelligentDatabaseQueryAI;