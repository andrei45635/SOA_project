import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { EmailRequest, EmailResult, EmailLog } from '../types';

class EmailService {
    private emailLogs: EmailLog[] = [];
    private maxLogs: number = 1000;

    async sendEmail(request: EmailRequest): Promise<EmailResult> {
        const id = uuidv4();
        const now = new Date();

        console.log(`[Email FaaS] Processing email request:`);
        console.log(`  To: ${request.to}`);
        console.log(`  Subject: ${request.subject}`);
        console.log(`  User ID: ${request.userId}`);

        try {
            await this.simulateSendEmail(request);

            const log: EmailLog = {
                id,
                to: request.to,
                subject: request.subject,
                body: request.body,
                userId: request.userId,
                status: 'sent',
                sentAt: now,
            };

            this.addLog(log);

            console.log(`[Email FaaS] Email sent successfully: ${id}`);

            return {
                id,
                to: request.to,
                subject: request.subject,
                status: 'sent',
                sentAt: now,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            const log: EmailLog = {
                id,
                to: request.to,
                subject: request.subject,
                body: request.body,
                userId: request.userId,
                status: 'failed',
                sentAt: now,
                error: errorMessage,
            };

            this.addLog(log);

            console.error(`[Email FaaS] Email failed: ${id}`, errorMessage);

            return {
                id,
                to: request.to,
                subject: request.subject,
                status: 'failed',
                error: errorMessage,
            };
        }
    }

    private async simulateSendEmail(request: EmailRequest): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        if (Math.random() < 0.02) {
            throw new Error('Simulated SMTP connection failure');
        }

        console.log(`[Email FaaS] ========== SIMULATED EMAIL ==========`);
        console.log(`From: ${config.email.from}`);
        console.log(`To: ${request.to}`);
        console.log(`Subject: ${request.subject}`);
        console.log(`Body: ${request.body}`);
        console.log(`[Email FaaS] =====================================`);
    }

    private addLog(log: EmailLog): void {
        this.emailLogs.unshift(log);
        if (this.emailLogs.length > this.maxLogs) {
            this.emailLogs = this.emailLogs.slice(0, this.maxLogs);
        }
    }

    getLogs(limit: number = 50): EmailLog[] {
        return this.emailLogs.slice(0, limit);
    }

    getLogById(id: string): EmailLog | undefined {
        return this.emailLogs.find(log => log.id === id);
    }

    getLogsByUserId(userId: string, limit: number = 50): EmailLog[] {
        return this.emailLogs
            .filter(log => log.userId === userId)
            .slice(0, limit);
    }

    getStats(): { total: number; sent: number; failed: number } {
        const sent = this.emailLogs.filter(log => log.status === 'sent').length;
        const failed = this.emailLogs.filter(log => log.status === 'failed').length;
        return {
            total: this.emailLogs.length,
            sent,
            failed,
        };
    }
}

export const emailService = new EmailService();