// src/services/schemaKnowledge.js - Deep understanding of the data structure
class SchemaKnowledge {
    constructor() {
        this.schema = {
            root: {
                _id: { type: "ObjectId", description: "MongoDB unique identifier" },
                channel: { type: "string", description: "Data channel, typically 'data'" },
                entity: { type: "string", description: "Entity type, typically 'eadmin'" },
                entityKey: { type: "string", description: "Entity key, matches ticket ID" },
                key: { type: "string", description: "Primary conversation identifier" },
                createdAt: { type: "Date", description: "When the conversation record was created" },
                updatedAt: { type: "Date", description: "Last update to the conversation record" },
                handled: { type: "string", description: "Processing status, typically 'done'" },
                version: { type: "number", description: "Version number for optimistic locking" },
                idx: { type: "array", description: "Indexes for fast lookups" },
                ref: { type: "array", description: "References to related entities" }
            },
            data: {
                ticket: {
                    TicketID: { 
                        type: "number", 
                        description: "Internal numeric ticket ID (e.g., 13001952)",
                        example: 13001952,
                        searchable: true
                    },
                    TicketNumber: { 
                        type: "string", 
                        description: "External ticket number for customers (e.g., '2025082010043337')",
                        example: "2025082010043337",
                        searchable: true,
                        format: "YYYYMMDD + 8 digits"
                    },
                    Title: { 
                        type: "string", 
                        description: "Ticket subject/title",
                        searchable: true
                    },
                    CustomerID: { 
                        type: "string", 
                        description: "Customer email address",
                        searchable: true
                    },
                    CustomerUserID: { 
                        type: "string", 
                        description: "Alternative customer identifier"
                    },
                    Queue: { 
                        type: "string", 
                        description: "Department handling the ticket",
                        values: ["Customer Support", "Technical Support", "Billing Support", "Sales", "IT Helpdesk", "Product Support", "CSG PCB::IT (for Testing only)", "Account Management"]
                    },
                    QueueID: { 
                        type: "number", 
                        description: "Numeric queue identifier"
                    },
                    State: { 
                        type: "string", 
                        description: "Detailed ticket state",
                        values: ["new", "open", "pending reminder", "pending auto", "pending close", "closed successful", "closed unsuccessful"]
                    },
                    StateType: { 
                        type: "string", 
                        description: "Simplified state category",
                        values: ["new", "open", "pending", "closed"]
                    },
                    StateID: { 
                        type: "number", 
                        description: "Numeric state identifier"
                    },
                    Priority: { 
                        type: "string", 
                        description: "Priority level with description",
                        values: ["1 very low", "2 low", "3 normal", "4 high", "5 very high"]
                    },
                    PriorityID: { 
                        type: "number", 
                        description: "Numeric priority (1-5)",
                        range: [1, 5]
                    },
                    Owner: { 
                        type: "string", 
                        description: "Username of ticket owner/agent"
                    },
                    OwnerID: { 
                        type: "number", 
                        description: "Numeric owner identifier"
                    },
                    Responsible: { 
                        type: "string", 
                        description: "Responsible agent username"
                    },
                    ResponsibleID: { 
                        type: "number", 
                        description: "Numeric responsible party ID"
                    },
                    Type: { 
                        type: "string", 
                        description: "Ticket type",
                        default: "default"
                    },
                    TypeID: { 
                        type: "number", 
                        description: "Numeric type identifier"
                    },
                    Created: { 
                        type: "Date", 
                        description: "When the ticket was created",
                        searchable: true
                    },
                    Changed: { 
                        type: "Date", 
                        description: "Last modification date"
                    },
                    Closed: { 
                        type: "Date/null", 
                        description: "When ticket was closed (null if still open)"
                    },
                    Age: { 
                        type: "number", 
                        description: "Age in seconds since creation"
                    },
                    SolutionInMin: { 
                        type: "number/null", 
                        description: "Time to resolution in minutes"
                    },
                    TimeUnit: { 
                        type: "number", 
                        description: "Time accounting unit"
                    },
                    Lock: { 
                        type: "string", 
                        description: "Lock status",
                        values: ["lock", "unlock"]
                    },
                    LockID: { 
                        type: "number", 
                        description: "Lock identifier"
                    },
                    UnlockTimeout: { 
                        type: "number", 
                        description: "Timestamp when lock expires"
                    },
                    ArchiveFlag: { 
                        type: "string", 
                        description: "Archive status",
                        values: ["y", "n"]
                    },
                    DynamicField: { 
                        type: "array", 
                        description: "Custom fields array",
                        structure: {
                            Name: "Field name",
                            Value: "Field value (often null)"
                        }
                    }
                },
                article: {
                    _description: "Array of messages/articles in the conversation",
                    ArticleID: { 
                        type: "number", 
                        description: "Unique article identifier"
                    },
                    ArticleNumber: { 
                        type: "number", 
                        description: "Sequential number within ticket (1, 2, 3...)"
                    },
                    TicketID: { 
                        type: "number", 
                        description: "Parent ticket ID"
                    },
                    Subject: { 
                        type: "string", 
                        description: "Message subject line",
                        searchable: true
                    },
                    Body: { 
                        type: "string", 
                        description: "Message content/text",
                        searchable: true
                    },
                    From: { 
                        type: "string", 
                        description: "Sender email/name"
                    },
                    To: { 
                        type: "string", 
                        description: "Recipient email/name"
                    },
                    Cc: { 
                        type: "string", 
                        description: "CC recipients"
                    },
                    Bcc: { 
                        type: "string", 
                        description: "BCC recipients"
                    },
                    SenderType: { 
                        type: "string", 
                        description: "Type of sender",
                        values: ["customer", "agent", "system"]
                    },
                    SenderTypeID: { 
                        type: "string", 
                        description: "Numeric sender type",
                        mapping: { "1": "agent", "2": "system", "3": "customer" }
                    },
                    CreateTime: { 
                        type: "string", 
                        description: "When message was created"
                    },
                    ChangeTime: { 
                        type: "string", 
                        description: "When message was last changed"
                    },
                    IsVisibleForCustomer: { 
                        type: "number", 
                        description: "Whether customer can see this (0=no, 1=yes)"
                    },
                    ContentType: { 
                        type: "string", 
                        description: "MIME content type"
                    },
                    MessageID: { 
                        type: "string", 
                        description: "Email message ID for threading"
                    }
                },
                attachment: {
                    _description: "Array of file attachments",
                    Filename: { 
                        type: "string", 
                        description: "Original filename"
                    },
                    ContentType: { 
                        type: "string", 
                        description: "MIME type of file"
                    },
                    FilesizeRaw: { 
                        type: "number", 
                        description: "File size in bytes"
                    },
                    FileID: { 
                        type: "string", 
                        description: "File identifier within article"
                    },
                    Disposition: { 
                        type: "string", 
                        description: "How file should be displayed",
                        values: ["inline", "attachment"]
                    },
                    path: { 
                        type: "string", 
                        description: "Storage path for file"
                    }
                }
            },
            statistics: {
                totalFields: 65,
                nestedLevels: 3,
                arrayFields: ["article", "attachment", "DynamicField", "idx", "ref"],
                dateFields: ["Created", "Changed", "Closed", "createdAt", "updatedAt"],
                searchableFields: ["TicketID", "TicketNumber", "Title", "CustomerID", "Queue", "State", "Body", "Subject"]
            }
        };
    }

    explainStructure() {
        return `The conversation database has a sophisticated structure:

**Main Document Structure:**
- Each document represents a complete conversation/ticket
- Primary key is 'key' field (matches TicketID)
- Contains metadata (created, updated, version) and main 'data' object

**Core Data Sections:**

1. **Ticket Object** (data.ticket):
   - Contains 30+ fields describing the ticket
   - Two ID systems: TicketID (numeric) and TicketNumber (string)
   - Tracks state, priority, ownership, timestamps
   - Includes custom DynamicField array for extensions

2. **Articles Array** (data.article):
   - Each article is a message in the conversation
   - Tracks sender, recipient, content, timestamps
   - SenderType identifies if from customer, agent, or system
   - Articles are numbered sequentially

3. **Attachments Array** (data.attachment):
   - Files attached to articles
   - Includes filename, size, MIME type, storage path

**Key Relationships:**
- Articles reference their parent ticket via TicketID
- Attachments reference their parent article
- Multiple index arrays (idx, ref) for fast lookups`;
    }

    getFieldInfo(fieldPath) {
        // Navigate the schema to find field info
        const parts = fieldPath.split('.');
        let current = this.schema;
        
        for (const part of parts) {
            if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    generateFieldList(section = null) {
        if (!section) {
            return this.getAllFields();
        }
        
        switch(section.toLowerCase()) {
            case 'ticket':
                return this.getTicketFields();
            case 'article':
            case 'message':
                return this.getArticleFields();
            case 'attachment':
                return this.getAttachmentFields();
            default:
                return `Unknown section: ${section}`;
        }
    }

    getTicketFields() {
        const fields = this.schema.data.ticket;
        let response = "**Ticket Fields in the Database:**\n\n";
        
        for (const [field, info] of Object.entries(fields)) {
            if (typeof info === 'object' && info.description) {
                response += `• **${field}** (${info.type}): ${info.description}\n`;
                if (info.example) response += `  Example: ${info.example}\n`;
                if (info.values) response += `  Possible values: ${info.values.join(', ')}\n`;
            }
        }
        
        return response;
    }

    getArticleFields() {
        const fields = this.schema.data.article;
        let response = "**Article/Message Fields:**\n\n";
        
        for (const [field, info] of Object.entries(fields)) {
            if (field !== '_description' && typeof info === 'object') {
                response += `• **${field}** (${info.type}): ${info.description}\n`;
                if (info.values) response += `  Values: ${info.values.join(', ')}\n`;
            }
        }
        
        return response;
    }

    getAttachmentFields() {
        const fields = this.schema.data.attachment;
        let response = "**Attachment Fields:**\n\n";
        
        for (const [field, info] of Object.entries(fields)) {
            if (field !== '_description' && typeof info === 'object') {
                response += `• **${field}** (${info.type}): ${info.description}\n`;
            }
        }
        
        return response;
    }

    getAllFields() {
        return `${this.getTicketFields()}\n${this.getArticleFields()}\n${this.getAttachmentFields()}`;
    }

    isMetaQuestion(message) {
        const metaPatterns = [
            /what.*(fields?|structure|schema|data\s*structure|properties|attributes)/i,
            /explain.*(structure|schema|database|fields)/i,
            /describe.*(data|structure|schema)/i,
            /how.*(structured|organized|stored)/i,
            /what.*(can|do).*(access|query|search)/i,
            /tell.*about.*(database|structure|schema)/i,
            /what.*kind.*of.*(ticket|data|field|information)/i
        ];
        
        return metaPatterns.some(pattern => pattern.test(message));
    }
}

const schemaKnowledge = new SchemaKnowledge();
export default schemaKnowledge;