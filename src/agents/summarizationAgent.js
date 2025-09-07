// src\agents\summarizationAgent.js
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Initialize Ollama model for summarization
// 🔄 SWAP MODEL: Change SUMMARIZATION_MODEL in .env to use different model (e.g., 'mistral:7b', 'llama2:7b')
const summarizationModel = new ChatOllama({
    temperature: 0.3, // Lower temperature for more focused summaries
    maxRetries: 2,
    model: process.env.SUMMARIZATION_MODEL || 'mistral:7b',
    baseURL: process.env.OLLAMA_BASE_URL,
});

class SummarizationAgent {
    
    async summarize(conversation, debugLog = () => {}) {
        debugLog("📝 Starting conversation summarization");
        
        if (!conversation || !conversation.data) {
            throw new Error("Invalid conversation data provided");
        }

        const ticket = conversation.data.ticket;
        const articles = conversation.data.article || [];
        const attachments = conversation.data.attachment || [];

        debugLog(`📄 Processing conversation: ${ticket.TicketNumber} with ${articles.length} articles`);

        // Prepare conversation text for summarization
        const conversationText = this.prepareConversationText(ticket, articles, attachments);
        
        // Use different summarization approaches based on conversation complexity
        if (conversationText.length > 8000 || articles.length > 10) {
            debugLog("📚 Complex conversation detected, using multi-step summarization");
            return await this.generateComplexSummary(ticket, articles, attachments, debugLog);
        } else {
            debugLog("📄 Standard conversation, using single-step summarization");
            return await this.generateStandardSummary(conversationText, ticket, debugLog);
        }
    }

    prepareConversationText(ticket, articles, attachments) {
        let text = `TICKET INFORMATION:\n`;
        text += `Ticket Number: ${ticket.TicketNumber}\n`;
        text += `Title: ${ticket.Title}\n`;
        text += `Customer: ${ticket.CustomerID}\n`;
        text += `Queue: ${ticket.Queue}\n`;
        text += `Current State: ${ticket.State}\n`;
        text += `Priority: ${ticket.Priority}\n`;
        text += `Created: ${ticket.Created}\n`;
        if (ticket.Closed) text += `Closed: ${ticket.Closed}\n`;
        text += `\n`;

        // Add articles in chronological order
        text += `CONVERSATION HISTORY:\n`;
        articles.forEach((article, index) => {
            text += `\n[Message ${index + 1}] ${article.CreateTime}\n`;
            text += `From: ${article.From} (${article.SenderType})\n`;
            if (article.Subject && article.Subject !== ticket.Title) {
                text += `Subject: ${article.Subject}\n`;
            }
            text += `Content: ${article.Body}\n`;
        });

        // Add attachment information
        if (attachments.length > 0) {
            text += `\nATTACHMENTS:\n`;
            attachments.forEach(att => {
                text += `- ${att.Filename} (${att.ContentType})\n`;
            });
        }

        return text;
    }

    async generateStandardSummary(conversationText, ticket, debugLog) {
        const summaryPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert at summarizing customer support conversations. Create a comprehensive but concise summary.

CONVERSATION DATA:
{conversationText}

Create a well-structured summary with these sections:

**Issue Summary:**
- What was the main issue or request?
- Who was the customer and what did they need?

**Key Events:**
- Important messages and actions taken
- Significant responses from support agents
- Any escalations or complications

**Resolution:**
- How was the issue resolved (if it was)?
- What was the final outcome?
- Current status of the ticket

**Participants:**
- Customer and support team members involved
- Any external parties mentioned

**Files & Attachments:**
- List any files shared during the conversation

**Next Steps:** (if applicable)
- Any follow-up actions needed
- Outstanding issues or pending items

Keep the summary factual, concise, and focus on actionable information. Use bullet points where appropriate for clarity.
`);

        try {
            const summaryChain = summaryPrompt.pipe(summarizationModel).pipe(new StringOutputParser());
            const summary = await summaryChain.invoke({ conversationText });
            
            debugLog("✅ Summary generated successfully");
            return summary;
        } catch (error) {
            debugLog("❌ Error generating summary:", error);
            return this.generateFallbackSummary(ticket, conversationText);
        }
    }

    async generateComplexSummary(ticket, articles, attachments, debugLog) {
        debugLog("🔄 Generating multi-step summary for complex conversation");
        
        // Step 1: Summarize articles in chunks
        const chunkSize = 5; // Process 5 articles at a time
        const articleSummaries = [];
        
        for (let i = 0; i < articles.length; i += chunkSize) {
            const chunk = articles.slice(i, i + chunkSize);
            const chunkSummary = await this.summarizeArticleChunk(chunk, i, debugLog);
            articleSummaries.push(chunkSummary);
        }

        // Step 2: Create comprehensive summary from chunks
        return await this.createFinalSummary(ticket, articleSummaries, attachments, debugLog);
    }

    async summarizeArticleChunk(articles, startIndex, debugLog) {
        const chunkPrompt = ChatPromptTemplate.fromTemplate(`
Summarize this section of a conversation, focusing on key points and developments:

CONVERSATION SECTION (Messages {startIndex}-{endIndex}):
{articles}

Provide a concise summary highlighting:
- Main topics discussed in this section
- Any important decisions or actions taken
- Key information shared between participants
- Problems identified or progress made

Keep it brief but capture the essential information from this section.
`);

        const articlesText = articles.map((article, index) => {
            return `[${startIndex + index + 1}] ${article.CreateTime}
From: ${article.From} (${article.SenderType})
Subject: ${article.Subject}
Content: ${article.Body}
`;
        }).join('\n\n');

        try {
            const chunkChain = chunkPrompt.pipe(summarizationModel).pipe(new StringOutputParser());
            return await chunkChain.invoke({
                startIndex: startIndex + 1,
                endIndex: startIndex + articles.length,
                articles: articlesText
            });
        } catch (error) {
            debugLog("❌ Error summarizing article chunk:", error);
            return `Section ${startIndex + 1}-${startIndex + articles.length}: Error processing this section.`;
        }
    }

    async createFinalSummary(ticket, articleSummaries, attachments, debugLog) {
        const finalPrompt = ChatPromptTemplate.fromTemplate(`
Create a comprehensive summary from these conversation sections:

TICKET: {ticketTitle}
Customer: {customer}
Queue: {queue}
Status: {status}
Created: {created}

CONVERSATION SECTIONS:
{summaries}

ATTACHMENTS: {attachments}

Create a complete summary with:

**Overview:**
- What this conversation was about
- Main issue or request from the customer

**Conversation Flow:**
- Key developments and interactions
- Important decisions made
- Any problems encountered and how they were addressed

**Current Status:**
- Resolution status and outcome
- Current state of the ticket

**Participants:**
- Who was involved in this conversation

**Attachments:** (if any)
- Files shared during the conversation

**Summary:**
- Brief overall summary of the entire conversation and its outcome
`);

        const attachmentList = attachments.length > 0 
            ? attachments.map(att => `${att.Filename} (${att.ContentType})`).join(', ')
            : 'None';

        try {
            const finalChain = finalPrompt.pipe(summarizationModel).pipe(new StringOutputParser());
            return await finalChain.invoke({
                ticketTitle: ticket.Title,
                customer: ticket.CustomerID,
                queue: ticket.Queue,
                status: ticket.State,
                created: ticket.Created,
                summaries: articleSummaries.join('\n\n'),
                attachments: attachmentList
            });
        } catch (error) {
            debugLog("❌ Error creating final summary:", error);
            return this.generateFallbackSummary(ticket, articleSummaries.join(' '));
        }
    }

    generateFallbackSummary(ticket, content) {
        const wordCount = content.split(' ').length;
        const truncatedContent = content.length > 500 
            ? content.substring(0, 500) + '...' 
            : content;

        return `**Conversation Summary**

**Ticket:** ${ticket.TicketNumber} - ${ticket.Title}
**Customer:** ${ticket.CustomerID}
**Status:** ${ticket.State}
**Queue:** ${ticket.Queue}
**Created:** ${ticket.Created}

**Content Overview:**
${truncatedContent}

**Note:** This is a basic summary (${wordCount} words processed). For a more detailed analysis, please try again or check the conversation manually.`;
    }

    // Generate a quick summary for search results
    async generateQuickSummary(conversation, debugLog = () => {}) {
        const ticket = conversation.data.ticket;
        const articles = conversation.data.article || [];
        const firstMessage = articles[0]?.Body?.substring(0, 200) || 'No content';
        const lastMessage = articles[articles.length - 1]?.Body?.substring(0, 200) || 'No content';

        return `**${ticket.TicketNumber}** - ${ticket.Title}
**Customer:** ${ticket.CustomerID} | **Status:** ${ticket.State}
**Created:** ${ticket.Created} | **Queue:** ${ticket.Queue}

**First Message:** ${firstMessage}...
**Latest:** ${lastMessage}...
**Total Messages:** ${articles.length}`;
    }

    // Analyze conversation patterns across multiple conversations
    async analyzeConversationPatterns(conversations, debugLog = () => {}) {
        debugLog(`📊 Analyzing patterns across ${conversations.length} conversations`);
        
        const analysisPrompt = ChatPromptTemplate.fromTemplate(`
Analyze these conversations to identify patterns, trends, and insights:

CONVERSATIONS SUMMARY:
{conversationSummaries}

Provide analysis including:

**Common Issues:**
- Most frequent types of problems or requests
- Recurring themes across conversations

**Customer Behavior Patterns:**
- Common customer communication patterns
- Typical conversation flows

**Resolution Trends:**
- How issues are typically resolved
- Average resolution times and patterns

**Queue Analysis:**
- Which queues handle what types of issues
- Queue performance observations

**Recommendations:**
- Suggestions for improving customer service
- Identified areas for process improvement

Focus on actionable insights and patterns that could help improve customer service.
`);

        const conversationSummaries = conversations.map(conv => {
            const ticket = conv.data.ticket;
            const articles = conv.data.article || [];
            return `[${ticket.TicketNumber}] ${ticket.Title} - ${ticket.State} (${ticket.Queue}) - ${articles.length} messages`;
        }).join('\n');

        try {
            const analysisChain = analysisPrompt.pipe(summarizationModel).pipe(new StringOutputParser());
            return await analysisChain.invoke({ 
                conversationSummaries 
            });
        } catch (error) {
            debugLog("❌ Error generating pattern analysis:", error);
            return "Unable to generate conversation pattern analysis at this time.";
        }
    }
}

// Create singleton instance
const summarizationAgent = new SummarizationAgent();

export { summarizationAgent };
export default summarizationAgent;