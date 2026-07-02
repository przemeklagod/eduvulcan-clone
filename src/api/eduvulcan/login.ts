import { solveCaptchaPow } from './captcha';
import { decodeHtmlEntities, extractAttr, extractTag } from './html';
import { buildTenantTokenMap, decodeJwt } from './jwt';

const BASE_URL = 'https://eduvulcan.pl';

export class EduVulcanLoginError extends Error {}
export class InvalidCredentialsError extends EduVulcanLoginError {}
export class CaptchaRejectedError extends EduVulcanLoginError {}

interface QueryUserInfoResponse {
  success: boolean;
  data: { ShowCaptcha: boolean; ExtraMessage: string | null };
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
  });

  try {
    const json = (await response.json()) as QueryUserInfoResponse;
    return json?.data?.ShowCaptcha ?? false;
  } catch {
    return false;
  }
}

async function fetchLoginPage(): Promise<{ csrfToken: string; captcha: { challenge: string; difficulty: number; rounds: number } | null }> {
  const response = await fetch(`${BASE_URL}/logowanie`);
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
  // does not try to interpret the response at all - it only submits the form and
  // lets the session cookies (if any were set) speak for themselves. The actual
  // success/failure signal comes from GET /api/ap afterwards, which reports
  // Success/ErrorMessage explicitly.
  const response = await fetch(`${BASE_URL}/logowanie`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return { status: response.status };
}

async function fetchApPayload(context: string): Promise<ApResponse> {
  const response = await fetch(`${BASE_URL}/api/ap`);
  const html = await response.text();

  const apTag = extractTag(html, /<input[^>]*id="ap"[^>]*>/);
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
  });
}

export async function loginToEduVulcan(username: string, password: string): Promise<EduVulcanSession> {
  const showCaptcha = await queryShowCaptcha(username);
  const { csrfToken, captcha } = await fetchLoginPage();

  const captchaResponse =
    showCaptcha && captcha ? solveCaptchaPow(captcha.challenge, captcha.difficulty, captcha.rounds) : '';

  const submitResult = await submitLogin(username, password, csrfToken, captchaResponse);
  const context = `(POST /logowanie status=${submitResult.status}, showCaptcha=${showCaptcha}, hadCaptchaParams=${captcha !== null})`;

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
