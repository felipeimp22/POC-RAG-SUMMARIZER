// src/services/schemaKnowledge.js - Enhanced Deep Database Understanding
class EnhancedSchemaKnowledge {
    constructor() {
        this.schema = {
            // Complete structure with enhanced details
            root: {
                _id: { 
                    type: "ObjectId", 
                    description: "MongoDB unique identifier",
                    searchable: false,
                    example: "ObjectId('507f1f77bcf86cd799439011')"
                },
                channel: { 
                    type: "string", 
                    description: "Data channel, typically 'data'",
                    searchable: false,
                    commonValues: ["data"]
                },
                entity: { 
                    type: "string", 
                    description: "Entity type, typically 'eadmin'",
                    searchable: false,
                    commonValues: ["eadmin"]
                },
                entityKey: { 
                    type: "string", 
                    description: "Entity key, matches ticket ID",
                    searchable: true,
                    relationship: "matches data.ticket.TicketID"
                },
                key: { 
                    type: "string", 
                    description: "Primary conversation identifier",
                    searchable: true,
                    relationship: "matches data.ticket.TicketID as string"
                },
                createdAt: { 
                    type: "Date", 
                    description: "When the conversation record was created",
                    searchable: true,
                    queryPatterns: ["recent", "today", "yesterday", "this week"]
                },
                updatedAt: { 
                    type: "Date", 
                    description: "Last update to the conversation record",
                    searchable: true,
                    queryPatterns: ["recently updated", "changed today"]
                },
                handled: { 
                    type: "string", 
                    description: "Processing status, typically 'done'",
                    searchable: false,
                    commonValues: ["done", "processing", "pending"]
                },
                version: { 
                    type: "number", 
                    description: "Version number for optimistic locking",
                    searchable: false
                },
                idx: { 
                    type: "array", 
                    description: "Indexes for fast lookups",
                    searchable: false
                },
                ref: { 
                    type: "array", 
                    description: "References to related entities",
                    searchable: false
                }
            },
            ticket: {
                // Enhanced ticket fields with query patterns
                TicketID: {
                    type: "number",
                    description: "Internal numeric ticket ID",
                    example: 13001952,
                    searchable: true,
                    queryPatterns: ["ticket 13001952", "ID 13001952", "find ticket 13001952"],
                    mongoPath: "data.ticket.TicketID",
                    primaryKey: true
                },
                TicketNumber: {
                    type: "string",
                    description: "External ticket number for customers",
                    example: "2025082010043337",
                    searchable: true,
                    format: "YYYYMMDD + 8 digits",
                    queryPatterns: ["ticket 2025082010043337", "number 2025082010043337"],
                    mongoPath: "data.ticket.TicketNumber"
                },
                Title: {
                    type: "string",
                    description: "Ticket subject/title",
                    searchable: true,
                    queryPatterns: ["login problems", "password issues", "email trouble"],
                    mongoPath: "data.ticket.Title",
                    fullTextSearch: true
                },
                CustomerID: {
                    type: "string",
                    description: "Customer email address",
                    searchable: true,
                    format: "email",
                    queryPatterns: ["john@email.com", "tickets from john", "customer john@email.com"],
                    mongoPath: "data.ticket.CustomerID"
                },
                CustomerUserID: {
                    type: "string",
                    description: "Alternative customer identifier",
                    searchable: true,
                    mongoPath: "data.ticket.CustomerUserID"
                },
                Queue: {
                    type: "string",
                    description: "Department handling the ticket",
                    searchable: true,
                    values: [
                        "Customer Support",
                        "Technical Support", 
                        "Billing Support",
                        "Sales",
                        "IT Helpdesk",
                        "Product Support",
                        "CSG PCB::IT (for Testing only)",
                        "Account Management"
                    ],
                    queryPatterns: ["customer support tickets", "technical support", "billing issues"],
                    mongoPath: "data.ticket.Queue"
                },
                QueueID: {
                    type: "number",
                    description: "Numeric queue identifier",
                    searchable: true,
                    mongoPath: "data.ticket.QueueID"
                },
                State: {
                    type: "string",
                    description: "Detailed ticket state",
                    searchable: true,
                    values: [
                        "new",
                        "open", 
                        "pending reminder",
                        "pending auto",
                        "pending close",
                        "closed successful",
                        "closed unsuccessful"
                    ],
                    queryPatterns: ["open tickets", "closed tickets", "pending tickets", "new tickets"],
                    mongoPath: "data.ticket.State"
                },
                StateType: {
                    type: "string",
                    description: "Simplified state category",
                    searchable: true,
                    values: ["new", "open", "pending", "closed"],
                    queryPatterns: ["open", "closed", "pending", "new"],
                    mongoPath: "data.ticket.StateType",
                    recommendedForQueries: true
                },
                StateID: {
                    type: "number",
                    description: "Numeric state identifier",
                    searchable: true,
                    mongoPath: "data.ticket.StateID"
                },
                Priority: {
                    type: "string",
                    description: "Priority level with description",
                    searchable: true,
                    values: ["1 very low", "2 low", "3 normal", "4 high", "5 very high"],
                    queryPatterns: ["high priority", "urgent tickets", "low priority"],
                    mongoPath: "data.ticket.Priority"
                },
                PriorityID: {
                    type: "number",
                    description: "Numeric priority (1-5)",
                    searchable: true,
                    range: [1, 5],
                    queryPatterns: ["priority 4", "high priority (4-5)", "urgent (5)"],
                    mongoPath: "data.ticket.PriorityID",
                    recommendedForQueries: true
                },
                Owner: {
                    type: "string",
                    description: "Username of ticket owner/agent",
                    searchable: true,
                    queryPatterns: ["tickets owned by john", "agent john's tickets"],
                    mongoPath: "data.ticket.Owner"
                },
                OwnerID: {
                    type: "number",
                    description: "Numeric owner identifier",
                    searchable: true,
                    mongoPath: "data.ticket.OwnerID"
                },
                Responsible: {
                    type: "string",
                    description: "Responsible agent username",
                    searchable: true,
                    queryPatterns: ["responsible agent", "assigned to"],
                    mongoPath: "data.ticket.Responsible"
                },
                ResponsibleID: {
                    type: "number",
                    description: "Numeric responsible party ID",
                    searchable: true,
                    mongoPath: "data.ticket.ResponsibleID"
                },
                Type: {
                    type: "string",
                    description: "Ticket type",
                    searchable: true,
                    commonValues: ["default"],
                    mongoPath: "data.ticket.Type"
                },
                TypeID: {
                    type: "number",
                    description: "Numeric type identifier",
                    searchable: true,
                    mongoPath: "data.ticket.TypeID"
                },
                Created: {
                    type: "Date",
                    description: "When the ticket was created",
                    searchable: true,
                    queryPatterns: ["created today", "last week", "recent tickets", "Jan 2025"],
                    mongoPath: "data.ticket.Created",
                    recommendedForSorting: true
                },
                Changed: {
                    type: "Date",
                    description: "Last modification date",
                    searchable: true,
                    queryPatterns: ["recently changed", "updated today"],
                    mongoPath: "data.ticket.Changed"
                },
                Closed: {
                    type: "Date/null",
                    description: "When ticket was closed (null if still open)",
                    searchable: true,
                    queryPatterns: ["closed today", "resolved yesterday", "recently closed"],
                    mongoPath: "data.ticket.Closed"
                },
                Age: {
                    type: "number",
                    description: "Age in seconds since creation",
                    searchable: true,
                    unit: "seconds",
                    queryPatterns: ["old tickets", "tickets older than 1 week"],
                    mongoPath: "data.ticket.Age"
                },
                SolutionInMin: {
                    type: "number/null",
                    description: "Time to resolution in minutes",
                    searchable: true,
                    unit: "minutes",
                    queryPatterns: ["quick resolutions", "fast solved tickets"],
                    mongoPath: "data.ticket.SolutionInMin"
                },
                TimeUnit: {
                    type: "number",
                    description: "Time accounting unit",
                    searchable: false,
                    mongoPath: "data.ticket.TimeUnit"
                },
                Lock: {
                    type: "string",
                    description: "Lock status",
                    searchable: true,
                    values: ["lock", "unlock"],
                    mongoPath: "data.ticket.Lock"
                },
                LockID: {
                    type: "number",
                    description: "Lock identifier",
                    searchable: false,
                    mongoPath: "data.ticket.LockID"
                },
                UnlockTimeout: {
                    type: "number",
                    description: "Timestamp when lock expires",
                    searchable: false,
                    mongoPath: "data.ticket.UnlockTimeout"
                },
                ArchiveFlag: {
                    type: "string",
                    description: "Archive status",
                    searchable: true,
                    values: ["y", "n"],
                    queryPatterns: ["archived tickets", "active tickets"],
                    mongoPath: "data.ticket.ArchiveFlag"
                },
                DynamicField: {
                    type: "array",
                    description: "Custom fields array",
                    searchable: false,
                    structure: {
                        Name: "Field name",
                        Value: "Field value (often null)"
                    },
                    mongoPath: "data.ticket.DynamicField"
                }
            },
            article: {
                // Enhanced article/message fields
                ArticleID: {
                    type: "number",
                    description: "Unique article identifier",
                    searchable: true,
                    mongoPath: "data.article.ArticleID"
                },
                ArticleNumber: {
                    type: "number",
                    description: "Sequential number within ticket (1, 2, 3...)",
                    searchable: true,
                    queryPatterns: ["first message", "last message", "message 3"],
                    mongoPath: "data.article.ArticleNumber"
                },
                TicketID: {
                    type: "number",
                    description: "Parent ticket ID",
                    searchable: true,
                    relationship: "References data.ticket.TicketID",
                    mongoPath: "data.article.TicketID"
                },
                Subject: {
                    type: "string",
                    description: "Message subject line",
                    searchable: true,
                    fullTextSearch: true,
                    queryPatterns: ["Re: Login issues", "subject contains login"],
                    mongoPath: "data.article.Subject"
                },
                Body: {
                    type: "string",
                    description: "Message content/text",
                    searchable: true,
                    fullTextSearch: true,
                    queryPatterns: ["messages containing password", "login error", "help with"],
                    mongoPath: "data.article.Body",
                    primarySearchField: true
                },
                From: {
                    type: "string",
                    description: "Sender email/name",
                    searchable: true,
                    queryPatterns: ["messages from john@email.com", "sent by agent"],
                    mongoPath: "data.article.From"
                },
                To: {
                    type: "string",
                    description: "Recipient email/name",
                    searchable: true,
                    queryPatterns: ["messages to support", "sent to customer"],
                    mongoPath: "data.article.To"
                },
                Cc: {
                    type: "string",
                    description: "CC recipients",
                    searchable: true,
                    mongoPath: "data.article.Cc"
                },
                Bcc: {
                    type: "string",
                    description: "BCC recipients",
                    searchable: true,
                    mongoPath: "data.article.Bcc"
                },
                SenderType: {
                    type: "string",
                    description: "Type of sender",
                    searchable: true,
                    values: ["customer", "agent", "system"],
                    queryPatterns: ["customer messages", "agent replies", "system notifications"],
                    mongoPath: "data.article.SenderType",
                    recommendedForQueries: true
                },
                SenderTypeID: {
                    type: "string",
                    description: "Numeric sender type",
                    searchable: true,
                    mapping: { "1": "agent", "2": "system", "3": "customer" },
                    mongoPath: "data.article.SenderTypeID"
                },
                CreateTime: {
                    type: "string",
                    description: "When message was created",
                    searchable: true,
                    format: "ISO datetime string",
                    queryPatterns: ["messages today", "recent messages"],
                    mongoPath: "data.article.CreateTime"
                },
                ChangeTime: {
                    type: "string",
                    description: "When message was last changed",
                    searchable: true,
                    mongoPath: "data.article.ChangeTime"
                },
                IsVisibleForCustomer: {
                    type: "number",
                    description: "Whether customer can see this (0=no, 1=yes)",
                    searchable: true,
                    values: [0, 1],
                    queryPatterns: ["customer visible messages", "internal notes"],
                    mongoPath: "data.article.IsVisibleForCustomer"
                },
                ContentType: {
                    type: "string",
                    description: "MIME content type",
                    searchable: true,
                    commonValues: ["text/plain", "text/html"],
                    mongoPath: "data.article.ContentType"
                },
                MessageID: {
                    type: "string",
                    description: "Email message ID for threading",
                    searchable: true,
                    mongoPath: "data.article.MessageID"
                }
            },
            attachment: {
                // Enhanced attachment fields
                Filename: {
                    type: "string",
                    description: "Original filename",
                    searchable: true,
                    queryPatterns: ["tickets with screenshots", "PDF attachments", "image files"],
                    mongoPath: "data.attachment.Filename"
                },
                ContentType: {
                    type: "string",
                    description: "MIME type of file",
                    searchable: true,
                    commonValues: ["image/png", "image/jpeg", "application/pdf", "text/plain"],
                    queryPatterns: ["image attachments", "PDF files", "documents"],
                    mongoPath: "data.attachment.ContentType"
                },
                FilesizeRaw: {
                    type: "number",
                    description: "File size in bytes",
                    searchable: true,
                    unit: "bytes",
                    queryPatterns: ["large files", "small attachments"],
                    mongoPath: "data.attachment.FilesizeRaw"
                },
                FileID: {
                    type: "string",
                    description: "File identifier within article",
                    searchable: true,
                    mongoPath: "data.attachment.FileID"
                },
                Disposition: {
                    type: "string",
                    description: "How file should be displayed",
                    searchable: true,
                    values: ["inline", "attachment"],
                    mongoPath: "data.attachment.Disposition"
                },
                path: {
                    type: "string",
                    description: "Storage path for file",
                    searchable: false,
                    mongoPath: "data.attachment.path"
                }
            }
        };

        // Query optimization patterns
        this.queryPatterns = {
            customerSearch: {
                patterns: ["tickets from", "customer", "@", "email"],
                field: "data.ticket.CustomerID",
                type: "exact_match"
            },
            ticketIdSearch: {
                patterns: ["ticket", "ID", "number"],
                fields: ["data.ticket.TicketID", "data.ticket.TicketNumber"],
                type: "numeric_or_string"
            },
            statusSearch: {
                patterns: ["open", "closed", "pending", "new"],
                field: "data.ticket.StateType",
                type: "categorical"
            },
            prioritySearch: {
                patterns: ["high", "urgent", "priority", "important"],
                field: "data.ticket.PriorityID",
                type: "numeric_range"
            },
            contentSearch: {
                patterns: ["contains", "message", "says", "about"],
                field: "data.article.Body",
                type: "text_search"
            },
            dateSearch: {
                patterns: ["today", "yesterday", "recent", "last week", "this month"],
                field: "data.ticket.Created",
                type: "date_range"
            }
        };

        // Performance optimization hints
        this.optimizationHints = {
            indexedFields: [
                "data.ticket.TicketID",
                "data.ticket.CustomerID", 
                "data.ticket.StateType",
                "data.ticket.Created"
            ],
            efficientSorts: [
                {"data.ticket.Created": -1},
                {"data.ticket.Changed": -1},
                {"data.ticket.PriorityID": -1}
            ],
            limitRecommendations: {
                "browse": 20,
                "search": 50,
                "analysis": 100,
                "export": 1000
            }
        };
    }

    // Get complete structure explanation
    explainCompleteStructure() {
        return `
# COMPLETE DATABASE STRUCTURE - TICKETS & CONVERSATIONS

## Overview
The database contains support tickets with complete conversation histories. Each document represents one ticket with all its messages, attachments, and metadata.

## Root Document Structure
- **_id**: MongoDB unique identifier
- **key**: Primary conversation identifier (matches TicketID)
- **data**: Main content object containing ticket, articles, and attachments

## Ticket Information (data.ticket)
**Core Identifiers:**
- TicketID: Internal numeric ID (13001952)
- TicketNumber: External string ID (2025082010043337)
- Title: Ticket subject/description

**Customer & Assignment:**
- CustomerID: Customer email address
- Queue: Department handling ticket
- Owner: Assigned agent username
- Responsible: Responsible party

**Status & Priority:**
- State: Detailed status (new, open, pending reminder, closed successful, etc.)
- StateType: Simplified status (new, open, pending, closed)
- Priority: Text priority ("1 very low" to "5 very high")
- PriorityID: Numeric priority (1-5)

**Timestamps:**
- Created: When ticket was created
- Changed: Last modification
- Closed: When ticket was closed (null if open)

## Messages (data.article array)
Each message in the conversation:
- ArticleID: Unique message identifier
- Subject: Message subject line
- Body: Full message content (main searchable field)
- From/To: Sender and recipient
- SenderType: "customer", "agent", or "system"
- CreateTime: When message was created
- IsVisibleForCustomer: Whether customer can see (0/1)

## Attachments (data.attachment array)
Files attached to messages:
- Filename: Original file name
- ContentType: MIME type (image/png, application/pdf, etc.)
- FilesizeRaw: File size in bytes

## Most Useful Search Fields
1. **data.ticket.CustomerID** - Find all tickets for a customer
2. **data.ticket.TicketID** - Find specific ticket by ID
3. **data.ticket.StateType** - Filter by status (open, closed, etc.)
4. **data.article.Body** - Search message content
5. **data.ticket.Created** - Filter by creation date
6. **data.ticket.PriorityID** - Filter by priority level
        `;
    }

    // Get field information with query examples
    getFieldInfo(fieldName) {
        const parts = fieldName.split('.');
        let current = this.schema;
        
        for (const part of parts) {
            if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        if (current.queryPatterns) {
            current.exampleQueries = current.queryPatterns.map(pattern => ({
                pattern,
                mongoQuery: this.generateExampleQuery(fieldName, pattern)
            }));
        }
        
        return current;
    }

    // Generate example MongoDB query for a field and pattern
    generateExampleQuery(fieldPath, pattern) {
        const field = this.getFieldInfo(fieldPath);
        if (!field) return null;
        
        const mongoPath = field.mongoPath || fieldPath;
        
        switch (field.type) {
            case 'string':
                if (field.fullTextSearch) {
                    return { [mongoPath]: { $regex: pattern, $options: 'i' } };
                } else {
                    return { [mongoPath]: pattern };
                }
            case 'number':
                return { [mongoPath]: parseInt(pattern) || 0 };
            case 'Date':
                return { [mongoPath]: { $gte: new Date() } }; // Example date range
            default:
                return { [mongoPath]: pattern };
        }
    }

    // Get query optimization suggestions
    getOptimizationSuggestions(queryType = 'general') {
        return {
            indexedFields: this.optimizationHints.indexedFields,
            recommendedSort: this.optimizationHints.efficientSorts[0],
            suggestedLimit: this.optimizationHints.limitRecommendations[queryType] || 50,
            bestPractices: [
                "Use data.ticket.StateType instead of data.ticket.State for better performance",
                "Use data.ticket.PriorityID instead of data.ticket.Priority for numeric comparisons",
                "Always include a sort order for consistent results",
                "Use projection to limit returned fields when possible",
                "Prefer exact matches over regex when possible"
            ]
        };
    }

    // Detect query patterns from natural language
    detectQueryPattern(userMessage) {
        const message = userMessage.toLowerCase();
        const detectedPatterns = [];
        
        for (const [patternName, pattern] of Object.entries(this.queryPatterns)) {
            for (const keyword of pattern.patterns) {
                if (message.includes(keyword.toLowerCase())) {
                    detectedPatterns.push({
                        name: patternName,
                        field: pattern.field || pattern.fields,
                        type: pattern.type,
                        confidence: this.calculatePatternConfidence(message, keyword)
                    });
                    break;
                }
            }
        }
        
        return detectedPatterns.sort((a, b) => b.confidence - a.confidence);
    }

    calculatePatternConfidence(message, keyword) {
        const words = message.split(' ');
        const keywordIndex = words.findIndex(word => word.includes(keyword.toLowerCase()));
        
        // Higher confidence for exact matches and specific contexts
        let confidence = 0.5;
        
        if (words.includes(keyword.toLowerCase())) confidence += 0.3;
        if (keywordIndex === 0) confidence += 0.2; // First word
        if (message.length < 20) confidence += 0.1; // Short, specific queries
        
        return Math.min(confidence, 1.0);
    }

    // Get all searchable fields organized by category
    getSearchableFields() {
        return {
            ticket: {
                identifiers: ["TicketID", "TicketNumber"],
                customer: ["CustomerID", "CustomerUserID"],
                status: ["State", "StateType"],
                priority: ["Priority", "PriorityID"],
                assignment: ["Queue", "Owner", "Responsible"],
                content: ["Title"],
                dates: ["Created", "Changed", "Closed"]
            },
            messages: {
                content: ["Subject", "Body"],
                people: ["From", "To", "Cc", "Bcc"],
                metadata: ["SenderType", "CreateTime", "IsVisibleForCustomer"]
            },
            attachments: {
                files: ["Filename", "ContentType"],
                metadata: ["FilesizeRaw", "Disposition"]
            }
        };
    }

    // Check if a field exists and is searchable
    isFieldSearchable(fieldPath) {
        const field = this.getFieldInfo(fieldPath);
        return field && field.searchable === true;
    }

    // Get recommended fields for different query types
    getRecommendedFields(queryType) {
        const recommendations = {
            customer_search: ["data.ticket.CustomerID"],
            status_filter: ["data.ticket.StateType"],
            priority_filter: ["data.ticket.PriorityID"],
            content_search: ["data.article.Body", "data.ticket.Title"],
            date_filter: ["data.ticket.Created"],
            general_listing: ["data.ticket.TicketID", "data.ticket.Title", "data.ticket.CustomerID", "data.ticket.StateType"]
        };
        
        return recommendations[queryType] || recommendations.general_listing;
    }
}

// Export singleton instance
const enhancedSchemaKnowledge = new EnhancedSchemaKnowledge();
export default enhancedSchemaKnowledge;