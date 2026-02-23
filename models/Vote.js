const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
    sessionId: {
        type: Number,
        required: true
    },
    did: {
        type: String,
        required: true
    },
    candidateId: {
        type: Number,
        required: true
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true
    },
    voterId: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// For audit: list votes by session or by voter
VoteSchema.index({ sessionId: 1, timestamp: -1 });
VoteSchema.index({ did: 1, sessionId: 1 });

module.exports = mongoose.model('Vote', VoteSchema);
