import { randomUUID } from 'crypto';
import { buildSignatureHeaders } from './crypto/signer';
import type { ApiRequest, ApiResponse } from './types/envelope';
import { HEBE_STATUS_CODE, HebeApiError } from './types/envelope';

const APP_NAME = 'DzienniczekPlus 3.0';
const APP_VERSION = '26.04.01 (G)';
const USER_AGENT = 'Dart/3.10 (dart:io)';

export interface HebeCredential {
  tenant: string;
  restUrl: string;
  privateKeyPem: string;
  fingerprint: string;
  deviceId: string;
  deviceOs: 'iOS' | 'Android';
  deviceModel: string;
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

function wrapEnvelope<T>(credential: HebeCredential, payload: T): ApiRequest<T> {
  const now = new Date();
  return {
    API: 1,
    AppName: APP_NAME,
    AppVersion: APP_VERSION,
    CertificateId: credential.fingerprint,
    Envelope: payload,
    FirebaseToken: '',
    RequestId: randomUUID(),
    Timestamp: now.getTime(),
    TimestampFormatted: formatTimestamp(now),
  };
}

function buildQueryString(query?: Record<string, string | number | undefined>): string {
  if (!query) return '';
  const params = Object.entries(query).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (!params.length) return '';
  return '?' + params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

async function hebeRequest<TResponse>(
  credential: HebeCredential,
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  options: { query?: Record<string, string | number | undefined>; payload?: unknown } = {}
): Promise<TResponse> {
  const path = `${credential.restUrl}/${endpoint}`;
  const url = path + buildQueryString(options.query);

  const bodyObject = options.payload !== undefined ? wrapEnvelope(credential, options.payload) : null;
  const bodyText = bodyObject ? JSON.stringify(bodyObject) : null;

  const signatureHeaders = buildSignatureHeaders(credential.fingerprint, credential.privateKeyPem, path, bodyText);

  const response = await fetch(url, {
    method,
    headers: {
      vOS: credential.deviceOs,
      vDeviceModel: credential.deviceModel,
      vAPI: '1',
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
      ...signatureHeaders,
    },
    ...(bodyText ? { body: bodyText } : {}),
  });

  const responseText = await response.text();

  if (responseText.includes('<!DOCTYPE')) {
    throw new Error(`Hebe request to ${endpoint} returned an HTML error page (status ${response.status})`);
  }

  if (!response.ok) {
    // Hebe returns a normal JSON envelope with a real Status.Code/Message even on
    // HTTP 4xx/5xx (e.g. a 500 from a malformed request body still carries
    // "NullReferenceException" or similar in Status.Message) - surface that
    // instead of just the bare status code, which was otherwise the only thing
    // ever shown for actual server-side errors.
    try {
      const envelope = JSON.parse(responseText) as ApiResponse<unknown>;
      if (envelope?.Status?.Message) {
        throw new HebeApiError(envelope.Status.Code, envelope.Status.Message);
      }
    } catch (e) {
      if (e instanceof HebeApiError) throw e;
      // responseText wasn't a parseable envelope - fall through to the generic error below.
    }
    throw new Error(`Hebe request to ${endpoint} failed with HTTP ${response.status}: ${responseText.slice(0, 500)}`);
  }

  const envelope = JSON.parse(responseText) as ApiResponse<TResponse>;
  if (envelope.Status.Code !== HEBE_STATUS_CODE.OK) {
    throw new HebeApiError(envelope.Status.Code, envelope.Status.Message);
  }

  // A null Envelope alongside Status.Code 0 is a legitimate "success, no data"
  // response (e.g. device registration acks with no body) - callers that need
  // a value should type TResponse accordingly.
  return envelope.Envelope as TResponse;
}

export function hebeGet<TResponse>(
  credential: HebeCredential,
  endpoint: string,
  query?: Record<string, string | number | undefined>
): Promise<TResponse> {
  return hebeRequest<TResponse>(credential, 'GET', endpoint, { query });
}

export function hebePost<TResponse>(credential: HebeCredential, endpoint: string, payload: unknown): Promise<TResponse> {
  return hebeRequest<TResponse>(credential, 'POST', endpoint, { payload });
}
