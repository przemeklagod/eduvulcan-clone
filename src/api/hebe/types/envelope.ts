export interface ApiRequest<T> {
  API: number;
  AppName: string;
  AppVersion: string;
  CertificateId: string;
  Envelope: T;
  FirebaseToken: string;
  RequestId: string;
  Timestamp: number;
  TimestampFormatted: string;
}

export interface ApiStatus {
  Code: number;
  Message: string;
}

export interface ApiResponse<T> {
  Envelope: T | null;
  EnvelopeType: string;
  InResponseTo: string | null;
  RequestId: string;
  Status: ApiStatus;
  Timestamp: number;
  TimestampFormatted: string;
}

/** Known Status.Code values, ported from SzpontHttpClient.kt's dispatch table. */
export const HEBE_STATUS_CODE = {
  OK: 0,
  INTERNAL_SERVER_ERROR: -1,
  INVALID_SIGNATURE: 100,
  INVALID_BODY_MODEL: 101,
  MISSING_HEADER: 102,
  INVALID_HEADER: 103,
  MISSING_UNIT_SYMBOL: 104,
  CERTIFICATE_NOT_FOUND: 154,
  ENTITY_NOT_FOUND: 200,
  USED_TOKEN: 201,
  WRONG_TOKEN: 202,
  WRONG_PIN: 203,
  EXPIRED_TOKEN: 204,
  INVALID_PARAMETER_VALUE: 206,
  CONSTRAINT_VIOLATION: 214,
} as const;

export class HebeApiError extends Error {
  constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
  }
}
