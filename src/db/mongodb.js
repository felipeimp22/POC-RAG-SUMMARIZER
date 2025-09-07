// src\db\mongodb.js
import { MongoClient } from 'mongodb';

class MongoDBConnection {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            if (!this.client) {
                this.client = new MongoClient(process.env.MONGODB_URI, {
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                });
                
                await this.client.connect();
                this.db = this.client.db(process.env.MONGODB_DATABASE || 'conversations');
                
                console.log('✅ Connected to MongoDB');
                
                // Create indexes for better performance
                await this.createIndexes();
            }
            
            return this.db;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    async createIndexes() {
        try {
            const conversations = this.db.collection('conversations');
            
            // Create indexes for common queries based on your conversation schema
            await conversations.createIndex({ 'key': 1 }, { unique: true });
            await conversations.createIndex({ 'data.ticket.TicketNumber': 1 });
            await conversations.createIndex({ 'data.ticket.CustomerID': 1 });
            await conversations.createIndex({ 'data.ticket.State': 1 });
            await conversations.createIndex({ 'data.ticket.Created': 1 });
            await conversations.createIndex({ 'data.ticket.Queue': 1 });
            await conversations.createIndex({ 'createdAt': 1 });
            await conversations.createIndex({ 'updatedAt': 1 });
            
            // Text index for full-text search across conversation content
            await conversations.createIndex({
                'data.ticket.Title': 'text',
                'data.article.Subject': 'text',
                'data.article.Body': 'text',
                'data.article.From': 'text'
            });

            console.log('✅ MongoDB indexes created');
        } catch (error) {
            console.error('❌ Error creating indexes:', error);
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            console.log('🔌 MongoDB connection closed');
        }
    }

    // Utility methods for conversation operations
    async findConversations(filter = {}, options = {}) {
        const conversations = this.db.collection('conversations');
        return await conversations.find(filter, options).toArray();
    }

    async findConversationById(id) {
        const conversations = this.db.collection('conversations');
        return await conversations.findOne({ 
            $or: [
                { key: id },
                { 'data.ticket.TicketNumber': id },
                { entityKey: id }
            ]
        });
    }

    async searchConversationsByText(searchTerm, filters = {}, limit = 10) {
        const conversations = this.db.collection('conversations');
        
        const searchFilter = {
            $text: { $search: searchTerm },
            ...filters
        };

        return await conversations.find(searchFilter)
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .toArray();
    }

    async findConversationsByDateRange(startDate, endDate, additionalFilters = {}) {
        const conversations = this.db.collection('conversations');
        
        const filter = {
            'data.ticket.Created': {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            ...additionalFilters
        };

        return await conversations.find(filter)
            .sort({ 'data.ticket.Created': -1 })
            .toArray();
    }

    async findConversationsByCustomer(customerId) {
        const conversations = this.db.collection('conversations');
        
        return await conversations.find({
            'data.ticket.CustomerID': customerId
        }).sort({ 'data.ticket.Created': -1 }).toArray();
    }

    async findConversationsByQueue(queueName) {
        const conversations = this.db.collection('conversations');
        
        return await conversations.find({
            'data.ticket.Queue': queueName
        }).sort({ 'data.ticket.Created': -1 }).toArray();
    }

    async getRecentConversations(limit = 10) {
        const conversations = this.db.collection('conversations');
        
        return await conversations.find({})
            .sort({ 'data.ticket.Created': -1 })
            .limit(limit)
            .toArray();
    }

    async getConversationStats() {
        const conversations = this.db.collection('conversations');
        
        const stats = await conversations.aggregate([
            {
                $group: {
                    _id: null,
                    totalConversations: { $sum: 1 },
                    uniqueCustomers: { $addToSet: '$data.ticket.CustomerID' },
                    uniqueQueues: { $addToSet: '$data.ticket.Queue' },
                    avgArticlesPerConversation: { $avg: { $size: '$data.article' } }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalConversations: 1,
                    uniqueCustomers: { $size: '$uniqueCustomers' },
                    uniqueQueues: { $size: '$uniqueQueues' },
                    avgArticlesPerConversation: { $round: ['$avgArticlesPerConversation', 2] }
                }
            }
        ]).toArray();
        
        return stats[0] || {
            totalConversations: 0,
            uniqueCustomers: 0,
            uniqueQueues: 0,
            avgArticlesPerConversation: 0
        };
    }

    // Execute custom aggregation pipeline
    async executeAggregation(pipeline) {
        const conversations = this.db.collection('conversations');
        return await conversations.aggregate(pipeline).toArray();
    }

    // Get distinct values for a field
    async getDistinctValues(field, filter = {}) {
        const conversations = this.db.collection('conversations');
        return await conversations.distinct(field, filter);
    }
}

// Create singleton instance
const mongoConnection = new MongoDBConnection();

export { mongoConnection };
export default mongoConnection;