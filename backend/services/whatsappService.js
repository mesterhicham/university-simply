const https = require('https');

/**
 * WhatsApp Messaging Service
 * Supports official providers: Twilio and Meta WhatsApp Business Cloud API.
 * In production, strictly requires real provider credentials and returns failure if unconfigured.
 */
class WhatsAppService {
    constructor() {
        this.provider = process.env.WHATSAPP_PROVIDER || '';
        this.twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
        this.twilioToken = process.env.TWILIO_AUTH_TOKEN || '';
        this.twilioFrom = process.env.TWILIO_WHATSAPP_FROM || '';
        this.metaToken = process.env.META_WHATSAPP_TOKEN || '';
        this.metaPhoneId = process.env.META_PHONE_NUMBER_ID || '';
    }

    isConfigured() {
        if (this.provider === 'twilio') {
            return Boolean(this.twilioSid && this.twilioToken && this.twilioFrom);
        }
        if (this.provider === 'meta') {
            return Boolean(this.metaToken && this.metaPhoneId);
        }
        return false;
    }

    async sendOtp(phoneNumber, messageText) {
        const isProd = process.env.NODE_ENV === 'production';

        if (!this.isConfigured()) {
            if (isProd) {
                console.error('[WhatsApp Service Error] No active WhatsApp provider configured in production environment.');
                return {
                    success: false,
                    error: 'WhatsApp gateway is not configured on this server. Contact administrator.'
                };
            }
            // Development/Test simulated delivery mode (does not leak OTP code in logs)
            return {
                success: true,
                simulated: true,
                provider: 'simulator'
            };
        }

        if (this.provider === 'twilio') {
            return this._sendViaTwilio(phoneNumber, messageText);
        } else if (this.provider === 'meta') {
            return this._sendViaMeta(phoneNumber, messageText);
        }

        return {
            success: false,
            error: `Unsupported WhatsApp provider: ${this.provider}`
        };
    }

    _sendViaTwilio(to, message) {
        return new Promise((resolve) => {
            const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString('base64');
            const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const formattedFrom = this.twilioFrom.startsWith('whatsapp:') ? this.twilioFrom : `whatsapp:${this.twilioFrom}`;
            
            const postData = new URLSearchParams({
                From: formattedFrom,
                To: formattedTo,
                Body: message
            }).toString();

            const options = {
                hostname: 'api.twilio.com',
                port: 443,
                path: `/2010-04-01/Accounts/${this.twilioSid}/Messages.json`,
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (d) => { responseBody += d; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, provider: 'twilio' });
                    } else {
                        console.error('[Twilio Error]', res.statusCode, responseBody);
                        resolve({ success: false, error: 'Failed to deliver message via Twilio provider.' });
                    }
                });
            });

            req.on('error', (e) => {
                console.error('[Twilio Request Error]', e.message);
                resolve({ success: false, error: 'Twilio connection failed.' });
            });

            req.write(postData);
            req.end();
        });
    }

    _sendViaMeta(to, message) {
        return new Promise((resolve) => {
            const cleanTo = to.replace(/[^0-9]/g, '');
            const postData = JSON.stringify({
                messaging_product: 'whatsapp',
                to: cleanTo,
                type: 'text',
                text: { body: message }
            });

            const options = {
                hostname: 'graph.facebook.com',
                port: 443,
                path: `/v18.0/${this.metaPhoneId}/messages`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.metaToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (d) => { responseBody += d; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, provider: 'meta' });
                    } else {
                        console.error('[Meta WhatsApp Error]', res.statusCode, responseBody);
                        resolve({ success: false, error: 'Failed to deliver message via Meta WhatsApp provider.' });
                    }
                });
            });

            req.on('error', (e) => {
                console.error('[Meta WhatsApp Request Error]', e.message);
                resolve({ success: false, error: 'Meta connection failed.' });
            });

            req.write(postData);
            req.end();
        });
    }
}

module.exports = new WhatsAppService();
