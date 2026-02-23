const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Vote = require('../models/Vote');
const { authMiddleware, userMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { votingLimiter } = require('../middleware/rateLimiter');
const { AppError } = require('../middleware/errorHandler');
const { isValidAddress } = require('../utils/vc');

/**
 * @route   GET /api/voting/audit/:sessionId
 * @desc    List recorded votes for a session (audit / laporan: siapa vote apa di sesi mana)
 * @access  Private (admin only)
 */
router.get('/audit/:sessionId', authMiddleware, adminMiddleware, [
    param('sessionId').isInt({ min: 1 }).withMessage('Session ID must be a positive integer')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        }
        const sessionId = parseInt(req.params.sessionId, 10);
        const votes = await Vote.find({ sessionId })
            .sort({ timestamp: -1 })
            .lean();
        return res.json({ success: true, sessionId, count: votes.length, votes });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/voting/record
 * @desc    Record vote in database (off-chain metadata)
 * @access  Private (student or admin; token + role required)
 */
router.post('/record', votingLimiter, authMiddleware, userMiddleware, [
    body('sessionId')
        .notEmpty()
        .withMessage('Session ID is required')
        .isInt({ min: 1 })
        .withMessage('Session ID must be a positive integer'),
    body('did')
        .notEmpty()
        .withMessage('DID is required')
        .matches(/^did:/)
        .withMessage('Invalid DID format'),
    body('candidateId')
        .notEmpty()
        .withMessage('Candidate ID is required')
        .isInt({ min: 1 })
        .withMessage('Candidate ID must be a positive integer'),
    body('transactionHash')
        .notEmpty()
        .withMessage('Transaction hash is required')
        .matches(/^0x[a-fA-F0-9]{64}$/)
        .withMessage('Invalid transaction hash format')
], async (req, res, next) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { sessionId, did, candidateId, transactionHash } = req.body;

        // Check if vote already recorded for this transaction
        const existingVote = await Vote.findOne({ transactionHash });
        if (existingVote) {
            throw new AppError('Vote already recorded for this transaction', 400);
        }

        // Record vote in MongoDB for audit / reporting
        await Vote.create({
            sessionId,
            did,
            candidateId,
            transactionHash,
            voterId: req.user.id || req.user.studentId,
            timestamp: new Date()
        });

        console.log(`Recorded vote Session ${sessionId} ${did} -> Candidate ${candidateId} (Tx: ${transactionHash})`);
        
        res.json({
            success: true,
            message: 'Vote recorded successfully'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
