import express from 'express';
import { googleCallback, githubCallback, oauthError } from '../controllers/oauthController.js';

const router = express.Router();

// OAuth callbacks
router.post('/google/callback', googleCallback);
router.post('/github/callback', githubCallback);
router.get('/error', oauthError);

export default router;
