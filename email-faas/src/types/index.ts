export interface EmailRequest {
    to: string;
    subject: string;
    body: string;
    userId: string;
    templateId?: string;
    templateData?: Record<string, unknown>;
}

export interface EmailResult {
    id: string;
    to: string;
    subject: string;
    status: 'sent' | 'failed' | 'queued';
    sentAt?: Date;
    error?: string;
}

export interface EmailLog {
    id: string;
    to: string;
    subject: string;
    body: string;
    userId: string;
    status: 'sent' | 'failed';
    sentAt: Date;
    error?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}