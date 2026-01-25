import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { JwtPayload } from '../types';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: 'No authorization header provided',
            });
            return;
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            res.status(401).json({
                success: false,
                error: 'Invalid authorization format. Use: Bearer <token>',
            });
            return;
        }

        const payload = authService.verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
        return;
    }

    next();
};

export const authorizeOwnerOrAdmin = (userIdParam: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const resourceUserId = req.params[userIdParam] || req.body[userIdParam];

        if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
            next();
            return;
        }

        res.status(403).json({
            success: false,
            error: 'Access denied. You can only access your own resources.',
        });
    };
};