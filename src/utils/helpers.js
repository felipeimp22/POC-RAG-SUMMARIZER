// src\utils\helpers.js
/**
 * Utility functions for the Conversation AI Backend
 */

/**
 * Format dates consistently across the application
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculate time ago from a given date
 * @param {Date|string} date - Date to calculate from
 * @returns {string} - Human readable time ago string
 */
export function timeAgo(date) {
    if (!date) return 'N/A';
    
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    
    return formatDate(date);
}

/**
 * Truncate text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 100) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Clean and normalize user input
 * @param {string} input - User input to clean
 * @returns {string} - Cleaned input
 */
export function cleanUserInput(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/[^\w\s@.-]/g, '') // Remove special characters except common ones
        .substring(0, 1000); // Limit length
}

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Extract keywords from text for search
 * @param {string} text - Text to extract keywords from
 * @param {number} minLength - Minimum word length
 * @returns {string[]} - Array of keywords
 */
export function extractKeywords(text, minLength = 3) {
    if (!text || typeof text !== 'string') return [];
    
    const stopWords = new Set([
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'among', 'under', 'within',
        'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we',
        'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
        'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
        'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
        'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
        'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has',
        'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
        'might', 'must', 'can', 'is', 'am'
    ]);
    
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => 
            word.length >= minLength && 
            !stopWords.has(word) &&
            !word.match(/^\d+$/) // Exclude pure numbers
        )
        .slice(0, 20); // Limit to 20 keywords
}

/**
 * Parse date range from natural language
 * @param {string} dateString - Natural language date string
 * @returns {Object} - Object with start and end dates
 */
export function parseDateRange(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return { start: null, end: null };
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lowerStr = dateString.toLowerCase();
    
    // Today
    if (lowerStr.includes('today')) {
        return {
            start: today,
            end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
    }
    
    // Yesterday
    if (lowerStr.includes('yesterday')) {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
            start: yesterday,
            end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
    }
    
    // Last week
    if (lowerStr.includes('last week') || lowerStr.includes('past week')) {
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
            start: lastWeek,
            end: today
        };
    }
    
    // Last month
    if (lowerStr.includes('last month') || lowerStr.includes('past month')) {
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
            start: lastMonth,
            end: today
        };
    }
    
    // This week
    if (lowerStr.includes('this week')) {
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        return {
            start: startOfWeek,
            end: now
        };
    }
    
    // This month
    if (lowerStr.includes('this month')) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            start: startOfMonth,
            end: now
        };
    }
    
    return { start: null, end: null };
}

/**
 * Sanitize MongoDB query to prevent injection
 * @param {Object} query - MongoDB query object
 * @returns {Object} - Sanitized query
 */
export function sanitizeMongoQuery(query) {
    if (!query || typeof query !== 'object') return {};
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(query)) {
        // Skip dangerous operators
        if (key.startsWith('$') && ['$where', '$expr', '$function'].includes(key)) {
            continue;
        }
        
        // Recursively sanitize nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeMongoQuery(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Generate a simple hash for caching purposes
 * @param {string} str - String to hash
 * @returns {string} - Simple hash
 */
export function simpleHash(str) {
    if (!str || typeof str !== 'string') return '';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Format conversation data for display
 * @param {Object} conversation - Conversation object
 * @returns {Object} - Formatted conversation data
 */
export function formatConversationForDisplay(conversation) {
    if (!conversation || !conversation.data) return null;
    
    const ticket = conversation.data.ticket;
    const articles = conversation.data.article || [];
    const attachments = conversation.data.attachment || [];
    
    return {
        id: conversation.key,
        ticketNumber: ticket.TicketNumber,
        title: ticket.Title,
        customer: ticket.CustomerID,
        state: ticket.State,
        priority: ticket.Priority,
        queue: ticket.Queue,
        created: formatDate(ticket.Created),
        timeAgo: timeAgo(ticket.Created),
        messageCount: articles.length,
        attachmentCount: attachments.length,
        lastActivity: articles.length > 0 ? 
            formatDate(articles[articles.length - 1].CreateTime) : 
            formatDate(ticket.Created),
        summary: truncateText(articles[0]?.Body || ticket.Title, 150)
    };
}

/**
 * Validate conversation ID format
 * @param {string} id - Conversation ID to validate
 * @returns {boolean} - Whether ID format is valid
 */
export function isValidConversationId(id) {
    if (!id || typeof id !== 'string') return false;
    
    // Check for various ID formats that might be used
    const patterns = [
        /^\d{16}$/, // 16 digits (like 2025010610000001)
        /^[A-Z0-9-]+$/i, // Alphanumeric with dashes
        /^[a-f0-9]{24}$/i // MongoDB ObjectId format
    ];
    
    return patterns.some(pattern => pattern.test(id));
}

/**
 * Log performance metrics
 * @param {string} operation - Operation name
 * @param {number} startTime - Start time in milliseconds
 * @param {Object} metadata - Additional metadata
 */
export function logPerformance(operation, startTime, metadata = {}) {
    const duration = Date.now() - startTime;
    
    if (process.env.DEBUG_ENABLED === 'true') {
        console.log(`⏱️  ${operation}: ${duration}ms`, metadata);
    }
    
    // In production, you might want to send this to a monitoring service
    return duration;
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves when function succeeds or max retries reached
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (i === maxRetries) {
                throw lastError;
            }
            
            const delay = baseDelay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

export default {
    formatDate,
    timeAgo,
    truncateText,
    cleanUserInput,
    isValidEmail,
    extractKeywords,
    parseDateRange,
    sanitizeMongoQuery,
    simpleHash,
    formatConversationForDisplay,
    isValidConversationId,
    logPerformance,
    retryWithBackoff
};