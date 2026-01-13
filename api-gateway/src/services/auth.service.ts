import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { User, JwtPayload } from '../types';

const users: Map<string, User> = new Map();

// Add a default admin user
const adminId = uuidv4();
users.set(adminId, {
    id: adminId,
    email: 'admin@example.com',
    name: 'Admin User',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date(),
});

export class AuthService {
    async register(email: string, password: string, name: string): Promise<{ user: Omit<User, 'password'>; token: string }> {
        const existingUser = Array.from(users.values()).find(u => u.email === email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user: User = {
            id: uuidv4(),
            email,
            name,
            password: hashedPassword,
            role: 'customer',
            createdAt: new Date(),
        };

        users.set(user.id, user);
        const token = this.generateToken(user);
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async login(email: string, password: string): Promise<{ user: Omit<User, 'password'>; token: string }> {
        const user = Array.from(users.values()).find(u => u.email === email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isValidPassword = await bcrypt.compare(password, user.password || '');
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        const token = this.generateToken(user);

        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    generateToken(user: User): string {
        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });
    }

    verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, config.jwt.secret) as JwtPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    getUserById(userId: string): Omit<User, 'password'> | null {
        const user = users.get(userId);
        if (!user) return null;

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    getAllUsers(): Omit<User, 'password'>[] {
        return Array.from(users.values()).map(({ password: _, ...user }) => user);
    }
}

export const authService = new AuthService();