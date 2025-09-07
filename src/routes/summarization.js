// src/routes/summarization.js - DEDICATED SUMMARIZATION ENDPOINT
import SuperIntelligentDatabaseQueryAI from '../ai/SuperIntelligentDatabaseQueryAI.js';
import FormatterSummarizerAI from '../ai/FormatterSummarizerAI.js';
import mongoConnection from '../db/mongodb.js';

class SummarizationService {
    constructor() {
        this.databaseQueryAI = new SuperIntelligentDatabaseQueryAI();
        this.formatterSummarizerAI = new FormatterSummarizerAI();
        console.log('📋 Dedicated Summarization Service initialized');
    }

    async summarizeByIdentifier(identifier, debugLog = () => {}) {
        debugLog(`📋 Summarizing by identifier: ${identifier}`);
        
        try {
            // Initialize database connection
            await mongoConnection.connect();
            
            // Step 1: Find the ticket by different identifier types
            const ticket = await this.findTicketByIdentifier(identifier, debugLog);
            
            if (!ticket) {
                return {
                    success: false,
                    error: "Ticket not found",
                    message: `No ticket found with identifier: ${identifier}. Please check the TicketID, TicketNumber, or EntityKey.`,
                    identifier
                };
            }
            
            // Step 2: Create precise summary
            const summary = await this.createPreciseSummary(ticket, identifier, debugLog);
            
            return {
                success: true,
                identifier,
                ticket: {
                    ticketID: ticket.data.ticket.TicketID,
                    ticketNumber: ticket.data.ticket.TicketNumber,
                    entityKey: ticket.entityKey
                },
                summary,
                conversationLength: (ticket.data.article || []).length,
                attachmentCount: (ticket.data.attachment || []).length
            };
            
        } catch (error) {
            debugLog("❌ Summarization error:", error);
            return {
                success: false,
                error: error.message,
                message: "Failed to create summary. Please try again.",
                identifier
            };
        }
    }

    async findTicketByIdentifier(identifier, debugLog) {
        debugLog(`🔍 Searching for ticket with identifier: ${identifier}`);
        
        // Try different search strategies based on identifier format
        const searchStrategies = [
            // Strategy 1: Numeric TicketID
            () => {
                if (/^\d+$/.test(identifier)) {
                    const ticketId = parseInt(identifier);
                    debugLog(`Trying TicketID search: ${ticketId}`);
                    return mongoConnection.findConversations(
                        {"data.ticket.TicketID": ticketId},
                        {limit: 1}
                    );
                }
                return null;
            },
            
            // Strategy 2: TicketNumber (string)
            () => {
                debugLog(`Trying TicketNumber search: ${identifier}`);
                return mongoConnection.findConversations(
                    {"data.ticket.TicketNumber": identifier},
                    {limit: 1}
                );
            },
            
            // Strategy 3: EntityKey
            () => {
                debugLog(`Trying EntityKey search: ${identifier}`);
                return mongoConnection.findConversations(
                    {"entityKey": identifier},
                    {limit: 1}
                );
            },
            
            // Strategy 4: Key field
            () => {
                debugLog(`Trying Key search: ${identifier}`);
                return mongoConnection.findConversations(
                    {"key": identifier},
                    {limit: 1}
                );
            }
        ];
        
        // Try each strategy until we find a result
        for (const strategy of searchStrategies) {
            try {
                const result = await strategy();
                if (result && result.length > 0) {
                    debugLog(`✅ Found ticket using strategy`);
                    return result[0];
                }
            } catch (error) {
                debugLog(`Strategy failed:`, error.message);
                continue;
            }
        }
        
        return null;
    }

    async createPreciseSummary(ticket, originalIdentifier, debugLog) {
        debugLog("📝 Creating precise summary");
        
        const ticketData = ticket.data.ticket;
        const articles = ticket.data.article || [];
        const attachments = ticket.data.attachment || [];
        
        // Create structured summary data
        const summaryData = {
            identifier: originalIdentifier,
            ticket: {
                id: ticketData.TicketID,
                number: ticketData.TicketNumber,
                title: ticketData.Title,
                customer: ticketData.CustomerID,
                state: ticketData.State,
                stateType: ticketData.StateType,
                priority: ticketData.Priority,
                priorityId: ticketData.PriorityID,
                queue: ticketData.Queue,
                owner: ticketData.Owner,
                responsible: ticketData.Responsible,
                created: ticketData.Created,
                changed: ticketData.Changed,
                closed: ticketData.Closed,
                solutionTime: ticketData.SolutionInMin
            },
            conversation: {
                messageCount: articles.length,
                messages: articles.map((article, index) => ({
                    number: article.ArticleNumber || (index + 1),
                    from: article.From,
                    to: article.To,
                    subject: article.Subject,
                    body: article.Body,
                    createTime: article.CreateTime,
                    senderType: article.SenderType,
                    visibleToCustomer: article.IsVisibleForCustomer === 1
                })),
                timeline: this.createTimeline(articles)
            },
            attachments: {
                count: attachments.length,
                files: attachments.map(att => ({
                    filename: att.Filename,
                    size: att.FilesizeRaw,
                    type: att.ContentType,
                    disposition: att.Disposition
                }))
            },
            analysis: this.analyzeTicket(ticketData, articles, attachments)
        };
        
        // Generate intelligent narrative summary
        const narrative = this.generateNarrativeSummary(summaryData);
        
        return {
            summary: narrative,
            data: summaryData
        };
    }

    createTimeline(articles) {
        return articles
            .sort((a, b) => new Date(a.CreateTime) - new Date(b.CreateTime))
            .map(article => ({
                time: article.CreateTime,
                from: article.From,
                type: article.SenderType,
                subject: article.Subject,
                preview: article.Body ? article.Body.substring(0, 100) + '...' : ''
            }));
    }

    analyzeTicket(ticket, articles, attachments) {
        const customerMessages = articles.filter(a => a.SenderType === 'customer').length;
        const agentMessages = articles.filter(a => a.SenderType === 'agent').length;
        const systemMessages = articles.filter(a => a.SenderType === 'system').length;
        
        const isResolved = ticket.StateType === 'closed';
        const timeToResolution = ticket.SolutionInMin;
        
        const lastMessage = articles.length > 0 ? articles[articles.length - 1] : null;
        const firstMessage = articles.length > 0 ? articles[0] : null;
        
        return {
            messageBreakdown: {
                customer: customerMessages,
                agent: agentMessages,
                system: systemMessages,
                total: articles.length
            },
            status: {
                isOpen: ['new', 'open', 'pending'].includes(ticket.StateType),
                isClosed: ticket.StateType === 'closed',
                isResolved: isResolved,
                timeToResolution: timeToResolution
            },
            interaction: {
                firstContact: firstMessage ? firstMessage.CreateTime : null,
                lastActivity: lastMessage ? lastMessage.CreateTime : null,
                lastSender: lastMessage ? lastMessage.SenderType : null
            },
            complexity: {
                hasAttachments: attachments.length > 0,
                messageVolume: articles.length > 5 ? 'high' : articles.length > 2 ? 'medium' : 'low',
                priority: ticket.PriorityID >= 4 ? 'high' : ticket.PriorityID >= 3 ? 'medium' : 'low'
            }
        };
    }

    generateNarrativeSummary(data) {
        const t = data.ticket;
        const conv = data.conversation;
        const analysis = data.analysis;
        
        let summary = `# 📋 Ticket Summary: ${t.title}\n\n`;
        
        // Header with key info
        summary += `## 🎫 Ticket Information\n`;
        summary += `- **Ticket ID**: ${t.id}\n`;
        summary += `- **Ticket Number**: ${t.number}\n`;
        summary += `- **Customer**: ${t.customer}\n`;
        summary += `- **Status**: ${t.state} (${t.stateType})\n`;
        summary += `- **Priority**: ${t.priority}\n`;
        summary += `- **Queue**: ${t.queue}\n`;
        summary += `- **Owner**: ${t.owner || 'Unassigned'}\n`;
        summary += `- **Created**: ${t.created}\n`;
        
        if (t.closed) {
            summary += `- **Closed**: ${t.closed}\n`;
            if (t.solutionTime) {
                summary += `- **Resolution Time**: ${t.solutionTime} minutes\n`;
            }
        }
        
        summary += `\n## 💬 Conversation Overview\n`;
        summary += `- **Total Messages**: ${conv.messageCount}\n`;
        summary += `- **Customer Messages**: ${analysis.messageBreakdown.customer}\n`;
        summary += `- **Agent Messages**: ${analysis.messageBreakdown.agent}\n`;
        summary += `- **System Messages**: ${analysis.messageBreakdown.system}\n`;
        
        if (data.attachments.count > 0) {
            summary += `- **Attachments**: ${data.attachments.count} files\n`;
        }
        
        // Conversation flow
        summary += `\n## 📝 Conversation Flow\n`;
        conv.timeline.forEach((event, index) => {
            const emoji = event.type === 'customer' ? '👤' : event.type === 'agent' ? '👨‍💼' : '🤖';
            summary += `${index + 1}. ${emoji} **${event.from}** (${event.time})\n`;
            summary += `   📧 *${event.subject || 'No subject'}*\n`;
            summary += `   💭 ${event.preview}\n\n`;
        });
        
        // Analysis
        summary += `## 📊 Analysis\n`;
        summary += `- **Status**: ${analysis.status.isOpen ? '🟢 Open' : '🔴 Closed'}\n`;
        summary += `- **Priority Level**: ${analysis.complexity.priority === 'high' ? '🔴 High' : analysis.complexity.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}\n`;
        summary += `- **Complexity**: ${analysis.complexity.messageVolume} volume, ${analysis.complexity.hasAttachments ? 'with attachments' : 'no attachments'}\n`;
        
        if (analysis.interaction.lastSender) {
            summary += `- **Last Activity**: ${analysis.interaction.lastActivity} by ${analysis.interaction.lastSender}\n`;
        }
        
        // Attachments detail
        if (data.attachments.count > 0) {
            summary += `\n## 📎 Attachments\n`;
            data.attachments.files.forEach((file, index) => {
                const size = file.size ? `(${Math.round(file.size / 1024)} KB)` : '';
                summary += `${index + 1}. **${file.filename}** ${size}\n`;
                summary += `   📄 Type: ${file.type}\n\n`;
            });
        }
        
        // Next steps if open
        if (analysis.status.isOpen) {
            summary += `\n## 🚀 Next Steps\n`;
            if (analysis.interaction.lastSender === 'customer') {
                summary += `- ⏰ **Awaiting agent response** - Customer last responded ${analysis.interaction.lastActivity}\n`;
            } else if (analysis.interaction.lastSender === 'agent') {
                summary += `- ⏰ **Awaiting customer response** - Agent last responded ${analysis.interaction.lastActivity}\n`;
            }
            
            if (analysis.complexity.priority === 'high') {
                summary += `- 🚨 **High priority ticket** - Requires immediate attention\n`;
            }
        }
        
        return summary;
    }
}

// Export singleton instance
const summarizationService = new SummarizationService();
export default summarizationService;