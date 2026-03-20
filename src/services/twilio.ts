import axios from 'axios';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export interface TwilioSmsResult {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  errorCode?: number | null;
  errorMessage?: string | null;
}

export interface TwilioCallResult {
  sid: string;
  status: string;
  to: string;
  from: string;
  direction: string;
}

export interface TwilioBlastResult {
  to: string;
  success: boolean;
  sid?: string;
  error?: string;
}

function baseUrl(): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}`;
}

function authConfig() {
  return {
    auth: {
      username: config.twilio.accountSid,
      password: config.twilio.authToken,
    },
  };
}

export async function sendSMS(to: string, body: string): Promise<TwilioSmsResult> {
  const url = `${baseUrl()}/Messages.json`;

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', config.twilio.phoneNumber);
  params.append('Body', body);

  logger.debug(`Twilio sendSMS → ${to}`);

  const res = await axios.post<TwilioSmsResult>(url, params.toString(), {
    ...authConfig(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15_000,
  });

  return res.data;
}

export async function makeCall(to: string, twimlUrl: string): Promise<TwilioCallResult> {
  const url = `${baseUrl()}/Calls.json`;

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', config.twilio.phoneNumber);
  params.append('Url', twimlUrl);

  logger.debug(`Twilio makeCall → ${to} with TwiML ${twimlUrl}`);

  const res = await axios.post<TwilioCallResult>(url, params.toString(), {
    ...authConfig(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15_000,
  });

  return res.data;
}
