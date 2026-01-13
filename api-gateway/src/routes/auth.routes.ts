import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            res.status(400).json({
                success: false,
                error: 'Email, password, and name are required',
            });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters',
            });
            return;
        }

        const result = await authService.register(email, password, name);

        res.status(201).json({
            success: true,
            data: result,
            message: 'User registered successfully',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        res.status(400).json({
            success: false,
            error: message,
        });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
            return;
        }

        const result = await authService.login(email, password);

        res.json({
            success: true,
            data: result,
            message: 'Login successful',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({
            success: false,
            error: message,
        });
    }
});

router.get('/me', authenticate, (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
            return;
        }

        const user = authService.getUserById(req.user.userId);

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get user info',
        });
    }
});

router.get('/users', authenticate, authorizeAdmin, (req: Request, res: Response) => {
    try {
        const users = authService.getAllUsers();

        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get users',
        });
    }
});

export default router;