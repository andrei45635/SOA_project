const http = require('http');
const { v4: uuidv4 } = require('uuid');

const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
        return;
    }

    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const request = JSON.parse(body);

            if (!request.to || !request.subject || !request.body || !request.userId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Missing required fields: to, subject, body, userId',
                }));
                return;
            }

            const id = uuidv4();
            const now = new Date().toISOString();

            console.log(`[Email FaaS] Processing email:`);
            console.log(`  ID: ${id}`);
            console.log(`  To: ${request.to}`);
            console.log(`  Subject: ${request.subject}`);
            console.log(`  User ID: ${request.userId}`);

            const simulatedFailure = Math.random() < 0.02;

            if (simulatedFailure) {
                console.log(`[Email FaaS] Email failed: ${id}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    data: {
                        id,
                        to: request.to,
                        subject: request.subject,
                        status: 'failed',
                        sentAt: now,
                        error: 'Simulated SMTP connection failure',
                    },
                }));
                return;
            }

            console.log(`[Email FaaS] ========== SIMULATED EMAIL ==========`);
            console.log(`From: noreply@orderapp.com`);
            console.log(`To: ${request.to}`);
            console.log(`Subject: ${request.subject}`);
            console.log(`Body: ${request.body}`);
            console.log(`[Email FaaS] =====================================`);
            console.log(`[Email FaaS] Email sent successfully: ${id}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: {
                    id,
                    to: request.to,
                    subject: request.subject,
                    status: 'sent',
                    sentAt: now,
                },
            }));
        } catch (err) {
            console.error('[Email FaaS] Error:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Invalid JSON input',
            }));
        }
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`[Email FaaS] Function listening on port ${port}`);
});