// data\seed.js
import { faker } from '@faker-js/faker';
import mongoConnection from '../src/db/mongodb.js';

// Conversation seeder based on the provided conversation sample structure
class ConversationSeeder {
    constructor() {
        this.customerEmails = [];
        this.queues = [
            'Customer Support',
            'Technical Support', 
            'Billing Support',
            'Sales',
            'IT Helpdesk',
            'Product Support',
            'CSG PCB::IT (for Testing only)',
            'Account Management'
        ];
        this.states = [
            'new', 
            'open', 
            'pending reminder', 
            'pending auto',
            'pending close', 
            'closed successful', 
            'closed unsuccessful'
        ];
        this.stateTypes = ['new', 'open', 'pending', 'closed'];
        this.priorities = ['1 very low', '2 low', '3 normal', '4 high', '5 very high'];
        this.senderTypes = ['customer', 'agent', 'system'];
    }

    async seed() {
        try {
            console.log('🌱 Starting conversation seeding...');
            
            const db = await mongoConnection.connect();
            const conversations = db.collection('conversations');
            
            // Clear existing data if requested
            const clearExisting = process.argv.includes('--clear');
            if (clearExisting) {
                console.log('🗑️ Clearing existing conversations...');
                await conversations.deleteMany({});
            }

            // Generate consistent customer emails
            this.generateCustomerEmails(15);
            
            // Generate conversations
            const conversationCount = 30;
            console.log(`📝 Generating ${conversationCount} conversations...`);
            
            const conversationDocs = [];
            
            for (let i = 0; i < conversationCount; i++) {
                const conversation = this.generateConversation(i + 1);
                conversationDocs.push(conversation);
                
                if (i % 5 === 0) {
                    console.log(`Generated ${i + 1}/${conversationCount} conversations...`);
                }
            }
            
            // Insert conversations
            await conversations.insertMany(conversationDocs);
            
            console.log('✅ Seeding completed successfully!');
            console.log(`📊 Inserted ${conversationCount} conversations`);
            
            // Display statistics
            await this.displayStats(db);
            
        } catch (error) {
            console.error('❌ Seeding failed:', error);
        } finally {
            await mongoConnection.close();
        }
    }

    generateCustomerEmails(count) {
        for (let i = 0; i < count; i++) {
            this.customerEmails.push(faker.internet.email().toLowerCase());
        }
    }

    generateConversation(index) {
        // Generate unique ticket number (similar to your sample format)
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const day = String(new Date().getDate()).padStart(2, '0');
        const ticketNumber = `${year}${month}${day}${String(10000000 + index).slice(-8)}`;
        
        const ticketId = 13000000 + index;
        const customerId = faker.helpers.arrayElement(this.customerEmails);
        const state = faker.helpers.arrayElement(this.states);
        const stateType = this.getStateType(state);
        const priority = faker.helpers.arrayElement(this.priorities);
        const queue = faker.helpers.arrayElement(this.queues);
        
        // Generate creation date (last 3 months)
        const createdDate = faker.date.between({ 
            from: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000),
            to: new Date()
        });
        
        // Generate articles (1-6 per conversation)
        const articleCount = faker.number.int({ min: 1, max: 6 });
        const articles = [];
        const attachments = [];
        
        for (let i = 0; i < articleCount; i++) {
            const article = this.generateArticle(i + 1, ticketId, customerId, createdDate);
            articles.push(article);
            
            // Add attachments sometimes (20% chance)
            if (faker.datatype.boolean(0.2)) {
                const attachment = this.generateAttachment(article.ArticleID, i + 1);
                attachments.push(attachment);
            }
        }
        
        const lastArticleTime = new Date(articles[articles.length - 1].CreateTime);
        const changedDate = lastArticleTime;
        const closedDate = stateType === 'closed' ? changedDate : null;

        // Generate conversation document matching your sample structure
        return {
            channel: "data",
            entity: "eadmin", 
            entityKey: ticketNumber,
            createdAt: createdDate,
            key: ticketNumber,
            updatedAt: changedDate,
            data: {
                article: articles,
                attachment: attachments,
                changedAt: changedDate,
                startedAt: createdDate,
                ticket: {
                    ChangeBy: faker.number.int({ min: 1, max: 500 }),
                    Changed: changedDate,
                    UntilTime: 0,
                    OwnerID: faker.number.int({ min: 1, max: 50 }),
                    EscalationUpdateTime: 0,
                    Closed: closedDate?.toISOString().replace('T', ' ').replace('Z', '') || null,
                    PriorityID: parseInt(priority.charAt(0)),
                    Lock: "unlock",
                    State: state,
                    Priority: priority,
                    EscalationResponseTime: 0,
                    Created: createdDate,
                    Owner: faker.internet.userName(),
                    CustomerID: customerId,
                    QueueID: faker.number.int({ min: 1, max: 100 }),
                    SLAID: "",
                    ResponsibleID: faker.number.int({ min: 1, max: 50 }),
                    CustomerUserID: customerId,
                    SolutionInMin: stateType === 'closed' ? faker.number.int({ min: 30, max: 2880 }) : null,
                    Type: "default",
                    Age: Math.floor((Date.now() - createdDate.getTime()) / 1000),
                    Responsible: faker.internet.userName(),
                    EscalationSolutionTime: 0,
                    RealTillTimeNotUsed: 0,
                    ArchiveFlag: "n",
                    EscalationTime: 0,
                    Queue: queue,
                    LockID: 1,
                    UnlockTimeout: faker.number.int({ min: 0, max: 999999999 }),
                    GroupID: faker.number.int({ min: 1, max: 30 }),
                    TimeUnit: 0,
                    CreateBy: faker.number.int({ min: 1, max: 500 }),
                    ServiceID: "",
                    TypeID: 1,
                    TicketID: ticketId,
                    StateType: stateType,
                    Title: this.generateTicketTitle(),
                    StateID: faker.number.int({ min: 1, max: 10 }),
                    TicketNumber: ticketNumber,
                    DynamicField: this.generateDynamicFields(),
                    _ticket: ticketNumber
                }
            },
            handled: "done",
            version: faker.number.int({ min: 1, max: 5 }),
            idx: this.generateIndexes(ticketNumber, articles, attachments),
            ref: this.generateReferences(ticketNumber, articles, attachments)
        };
    }

    generateArticle(articleNumber, ticketId, customerId, baseDate) {
        const articleId = 40000000 + ticketId + articleNumber;
        const senderType = articleNumber === 1 ? 'customer' : faker.helpers.arrayElement(this.senderTypes);
        
        // Generate article date (progressive timestamps)
        const articleDate = new Date(baseDate.getTime() + articleNumber * 2 * 60 * 60 * 1000); // 2 hours apart
        
        const subjects = [
            'Initial support request',
            'Follow-up on ticket',
            'Additional information provided',
            'Issue resolution update', 
            'Clarification required',
            'Problem resolved',
            'Thank you for assistance',
            'Reopening for additional support'
        ];

        const bodies = [
            'I am experiencing technical difficulties and need immediate assistance with my account.',
            'Thank you for your response. I have attempted the suggested solution but the issue persists.',
            'Here is the requested additional information and screenshots.',
            'The issue has been partially resolved, but I still require help with one remaining aspect.',
            'Could you please provide more details about the steps mentioned in your previous message?',
            'The problem has been successfully resolved. Thank you for your excellent support.',
            'I appreciate the quick and professional assistance provided by your team.',
            'I need to reopen this ticket as the original issue has returned.'
        ];

        return {
            ArticleID: articleId,
            MessageID: senderType === 'customer' ? "" : `<${articleId}.${faker.string.alphanumeric(8)}@support.company.com>`,
            ChangeBy: faker.number.int({ min: 1, max: 500 }),
            SenderType: senderType,
            IncomingTime: Math.floor(articleDate.getTime() / 1000),
            From: senderType === 'customer' ? customerId : `${faker.internet.userName()}@support.company.com`,
            ReplyTo: "",
            IsVisibleForCustomer: senderType === 'system' ? 0 : 1,
            MimeType: "text/plain",
            SenderTypeID: senderType === 'customer' ? '3' : senderType === 'agent' ? '1' : '2',
            ChangeTime: articleDate.toISOString().replace('T', ' ').replace('Z', ''),
            CreateTime: articleDate.toISOString().replace('T', ' ').replace('Z', ''),
            Cc: "",
            Bcc: "",
            ContentType: "text/plain; charset=utf-8",
            InReplyTo: "",
            CommunicationChannelID: faker.number.int({ min: 1, max: 3 }),
            TimeUnit: 0,
            CreateBy: faker.number.int({ min: 1, max: 500 }),
            Charset: "utf-8",
            ContentCharset: "utf-8",
            TicketID: ticketId,
            Subject: faker.helpers.arrayElement(subjects),
            To: senderType === 'customer' ? 'support@company.com' : customerId,
            ArticleNumber: articleNumber,
            Body: faker.helpers.arrayElement(bodies),
            References: "",
            _article: articleId.toString(),
            _attachmentList: []
        };
    }

    generateAttachment(articleId, attachmentNumber) {
        const fileTypes = [
            { name: 'error_screenshot.png', type: 'image/png', size: faker.number.int({ min: 100000, max: 2000000 }) },
            { name: 'support_document.pdf', type: 'application/pdf', size: faker.number.int({ min: 10000, max: 500000 }) },
            { name: 'system_log.txt', type: 'text/plain', size: faker.number.int({ min: 1000, max: 50000 }) },
            { name: 'data_export.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: faker.number.int({ min: 5000, max: 100000 }) }
        ];
        
        const fileType = faker.helpers.arrayElement(fileTypes);
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const day = String(new Date().getDate()).padStart(2, '0');
        
        return {
            ContentID: "",
            ContentType: fileType.type,
            FilesizeRaw: fileType.size,
            ContentAlternative: "",
            Content: "",
            FileID: attachmentNumber.toString(),
            Filename: fileType.name,
            Disposition: "attachment",
            path: `${year}/${month}/${day}/${articleId}/${fileType.name}`,
            _attachment: `${articleId}-${attachmentNumber}`,
            _article: articleId.toString()
        };
    }

    generateTicketTitle() {
        const titles = [
            'Unable to access user account',
            'Payment processing failure',
            'Feature request for new dashboard',
            'Data export functionality not working',
            'Password reset not functioning',
            'Billing inquiry about recent charges',
            'API integration technical issue',
            'Account suspension question',
            'System integration setup assistance',
            'Performance degradation on platform',
            'Missing data in generated reports',
            'Email notification system failure',
            'Mobile application frequent crashes',
            'File upload functionality broken',
            'Subscription plan upgrade request'
        ];
        
        return faker.helpers.arrayElement(titles);
    }

    generateDynamicFields() {
        return [
            { Value: null, Name: "CLID" },
            { Value: null, Name: "CargoNumber" },
            { Value: null, Name: "ClientImporter" },
            { Value: null, Name: "ETA" },
            { Value: null, Name: "ExporterShipper" },
            { Value: null, Name: "FileNumber" },
            { Value: null, Name: "Port" },
            { Value: null, Name: "ProcessManagementActivityID" },
            { Value: null, Name: "ProcessManagementProcessID" },
            { Value: null, Name: "TicketFreeKey1" },
            { Value: null, Name: "TicketFreeKey2" },
            { Value: null, Name: "TicketFreeKey3" },
            { Value: null, Name: "TicketFreeKey4" },
            { Value: null, Name: "TicketFreeText1" },
            { Value: null, Name: "TicketFreeText2" },
            { Value: null, Name: "TicketFreeText3" },
            { Value: null, Name: "TicketFreeText4" }
        ];
    }

    getStateType(state) {
        if (state.includes('closed')) return 'closed';
        if (state.includes('pending')) return 'pending';
        if (state === 'new') return 'new';
        return 'open';
    }

    generateIndexes(ticketNumber, articles, attachments) {
        const indexes = [
            { n: "ticket", v: ticketNumber },
            { n: "eadmin", v: ticketNumber },
            { n: "startedAt", v: new Date() },
            { n: "changedAt", v: new Date() },
            { n: "tn", v: ticketNumber }
        ];
        
        articles.forEach(article => {
            indexes.push({ n: "article", v: article.ArticleID.toString() });
        });
        
        attachments.forEach(attachment => {
            indexes.push({ n: "attachment", v: attachment._attachment });
        });
        
        return indexes;
    }

    generateReferences(ticketNumber, articles, attachments) {
        const refs = [
            `${ticketNumber}.ticket`,
            `${ticketNumber}.eadmin`,
            `${ticketNumber}.tn`
        ];
        
        articles.forEach(article => {
            refs.push(`${article.ArticleID}.article`);
        });
        
        attachments.forEach(attachment => {
            refs.push(`${attachment._attachment}.attachment`);
        });
        
        return refs;
    }

    async displayStats(db) {
        const conversations = db.collection('conversations');
        
        const stats = await mongoConnection.getConversationStats();
        
        console.log('\n📊 Database Statistics:');
        console.log(`   Total conversations: ${stats.totalConversations}`);
        console.log(`   Unique customers: ${stats.uniqueCustomers}`);
        console.log(`   Unique queues: ${stats.uniqueQueues}`);
        console.log(`   Avg articles per conversation: ${stats.avgArticlesPerConversation}`);
        
        // Show some sample data
        const sampleConversations = await conversations.find({}).limit(3).toArray();
        console.log('\n📝 Sample Conversations:');
        sampleConversations.forEach(conv => {
            console.log(`   • ${conv.data.ticket.TicketNumber} - ${conv.data.ticket.Title}`);
            console.log(`     Customer: ${conv.data.ticket.CustomerID}`);
            console.log(`     State: ${conv.data.ticket.State} | Queue: ${conv.data.ticket.Queue}`);
        });
        
        console.log('\n🎯 Try these sample queries:');
        console.log('   - "Summarize ticket 2025010610000001"');
        console.log('   - "Find all open tickets"');
        console.log('   - "Search for tickets about account issues"');
        console.log(`   - "Show me conversations from ${sampleConversations[0]?.data.ticket.CustomerID}"`);
    }
}

// Run the seeder
const seeder = new ConversationSeeder();
seeder.seed().then(() => {
    console.log('🎉 Conversation seeding completed successfully!');
    console.log('\n🚀 You can now start the server with: npm run dev');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
});