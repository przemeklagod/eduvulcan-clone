import { solveCaptchaPow } from './captcha';
import { decodeHtmlEntities, extractAttr, extractTag } from './html';
import { buildTenantTokenMap, decodeJwt } from './jwt';

const BASE_URL = 'https://eduvulcan.pl';

export class EduVulcanLoginError extends Error {}
export class InvalidCredentialsError extends EduVulcanLoginError {}
export class CaptchaRejectedError extends EduVulcanLoginError {}

interface QueryUserInfoResponse {
  success: boolean;
  // Observed live: `data` is a plain boolean (the ShowCaptcha answer itself), not an
  // object. Kept the object shape too in case other accounts/tenants return it that way.
  data: boolean | { ShowCaptcha: boolean; ExtraMessage: string | null };
}

interface ApResponse {
  Success: boolean;
  Tokens: string[];
  Alias: string;
  Email: string;
  GivenName: string;
  Surname: string;
  IsConsentAccepted: boolean;
  CanAcceptConsent: boolean;
  AccessToken: string;
  ErrorMessage: string | null;
}

export interface EduVulcanSession {
  mainAccessToken: string;
  tenantTokens: Map<string, string>;
  alias: string;
  email: string;
}

async function queryShowCaptcha(username: string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/Account/QueryUserInfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `UserName=${encodeURIComponent(username)}`,
    credentials: 'include',
    cache: 'no-store',
  });

  try {
    const json = (await response.json()) as QueryUserInfoResponse;
    return typeof json?.data === 'boolean' ? json.data : (json?.data?.ShowCaptcha ?? false);
  } catch {
    return false;
  }
}

async function fetchLoginPage(): Promise<{ csrfToken: string; captcha: { challenge: string; difficulty: number; rounds: number } | null }> {
  const response = await fetch(`${BASE_URL}/logowanie`, { credentials: 'include', cache: 'no-store' });
  const html = await response.text();

  const csrfTag = extractTag(html, /<input[^>]*name="__RequestVerificationToken"[^>]*>/);
  const csrfToken = extractAttr(csrfTag, 'value');
  if (!csrfToken) throw new EduVulcanLoginError('Could not find CSRF token on login page');

  const captchaTag = extractTag(html, /<div[^>]*class="[^"]*captcha-wrapper[^"]*"[^>]*>/);
  let captcha: { challenge: string; difficulty: number; rounds: number } | null = null;
  if (captchaTag) {
    const challenge = extractAttr(captchaTag, 'data-challenge');
    const difficulty = extractAttr(captchaTag, 'data-difficulty');
    const rounds = extractAttr(captchaTag, 'data-rounds');
    if (challenge && difficulty && rounds) {
      captcha = { challenge, difficulty: Number(difficulty), rounds: Number(rounds) };
    }
  }

  return { csrfToken, captcha };
}

interface SubmitLoginResult {
  status: number;
  hints: string[];
}

const ERROR_KEYWORDS: Array<[needle: string, hint: string]> = [
  ['nieprawidłow', 'invalid-credentials-text'],
  ['błędny', 'wrong-text'],
  ['błąd', 'error-text'],
  ['captcha', 'captcha-mentioned'],
  ['robot', 'robot-check-mentioned'],
  ['zablokowa', 'account-locked-text'],
  ['limit', 'rate-limit-text'],
  ['validation-summary-errors', 'validation-summary-present'],
  ['field-validation-error', 'field-validation-error-present'],
];

function scanForHints(html: string): string[] {
  const lower = html.toLowerCase();
  return ERROR_KEYWORDS.filter(([needle]) => lower.includes(needle)).map(([, hint]) => hint);
}

async function submitLogin(username: string, password: string, csrfToken: string, captchaResponse: string): Promise<SubmitLoginResult> {
  const body =
    `UserName=${encodeURIComponent(username)}` +
    `&Password=${encodeURIComponent(password)}` +
    `&captcha-response=${encodeURIComponent(captchaResponse)}` +
    `&__RequestVerificationToken=${encodeURIComponent(csrfToken)}`;

  // The reference implementation disables redirect-following so it can read the
  // Location header directly (present only on a successful login). React Native's
  // fetch does neither reliably on iOS: `redirect: 'manual'` is ignored, and
  // `response.redirected` comes back `undefined` rather than a boolean. There is
  // also no safe way to distinguish "captcha rejected" from an ordinary re-render
  // of the login page by scanning the body for "robot"/"robak" - the page always
  // includes `<meta name="robots" content="noindex">`, which false-positives on
  // every non-redirected response regardless of the real cause. So this function
  // does not try to gate on the response - it only submits the form and lets the
  // session cookies (if any were set) speak for themselves; success/failure is
  // decided by GET /api/ap afterwards. It does, however, scan the body for known
  // error keywords purely for diagnostics, surfaced in the thrown error context.
  const response = await fetch(`${BASE_URL}/logowanie`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include',
    cache: 'no-store',
  });

  const html = await response.text();
  return { status: response.status, hints: scanForHints(html) };
}

async function fetchApPayload(context: string): Promise<ApResponse> {
  const response = await fetch(`${BASE_URL}/api/ap`, { credentials: 'include', cache: 'no-store' });
  const html = await response.text();

  const apTag = extractTag(html, /<input[^>]*id=["']ap["'][^>]*>/);
  const rawValue = extractAttr(apTag, 'value');
  if (!rawValue) {
    throw new InvalidCredentialsError(
      `Login did not succeed: no session data on /api/ap (check username/password). ${context}`
    );
  }

  return JSON.parse(decodeHtmlEntities(rawValue)) as ApResponse;
}

async function acceptConsent(): Promise<void> {
  await fetch(`${BASE_URL}/konto/zgody`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'Consent[0].Key=4&Consent[0].Value=true',
    credentials: 'include',
    cache: 'no-store',
  });
}

export async function loginToEduVulcan(username: string, password: string): Promise<EduVulcanSession> {
  const showCaptcha = await queryShowCaptcha(username);
  const { csrfToken, captcha } = await fetchLoginPage();

  const captchaResponse =
    showCaptcha && captcha ? solveCaptchaPow(captcha.challenge, captcha.difficulty, captcha.rounds) : '';

  const submitResult = await submitLogin(username, password, csrfToken, captchaResponse);
  const hintsPart = submitResult.hints.length ? `, hints=[${submitResult.hints.join(',')}]` : ', hints=[]';
  const context = `(POST /logowanie status=${submitResult.status}, showCaptcha=${showCaptcha}, hadCaptchaParams=${captcha !== null}, csrfLen=${csrfToken.length}${hintsPart})`;

  let ap = await fetchApPayload(context);
  if (!ap.Success) {
    throw new InvalidCredentialsError(`${ap.ErrorMessage ?? 'eduVulcan login failed'} ${context}`);
  }
  if (!ap.Tokens?.length) {
    throw new EduVulcanLoginError(`Login succeeded but no school tenants were returned ${context}`);
  }

  if (!ap.IsConsentAccepted && ap.CanAcceptConsent) {
    await acceptConsent();
    ap = await fetchApPayload(context);
  }

  return {
    mainAccessToken: ap.AccessToken,
    tenantTokens: buildTenantTokenMap(ap.Tokens),
    alias: ap.Alias,
    email: ap.Email,
  };
}

export { decodeJwt };
