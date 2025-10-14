import { Router } from 'express';
import { loginCtrl, meCtrl, refreshCtrl, registerCtrl, forgotPasswordCtrl, resetPasswordCtrl, logoutCtrl, createEmployeeCtrl, getUsersByIdsCtrl, testEmailCtrl } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const r = Router();
r.post('/register', asyncHandler(registerCtrl));
r.post('/login', asyncHandler(loginCtrl));
r.post('/logout', asyncHandler(logoutCtrl));
r.post('/refresh', asyncHandler(refreshCtrl));
r.post('/forgot-password', asyncHandler(forgotPasswordCtrl));
r.post('/reset-password', asyncHandler(resetPasswordCtrl));
r.post('/create-employee', asyncHandler(createEmployeeCtrl));
r.post('/get-users-by-ids', asyncHandler(getUsersByIdsCtrl));
r.get('/me', authenticateToken, asyncHandler(meCtrl));
r.get('/test-email', asyncHandler(testEmailCtrl));

export default r;