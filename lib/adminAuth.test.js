const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SESSION_MS, clientIp, createLimiter, createSession, readSession, sessionCookie, validSession,
} = require('./adminAuth');

const PASSWORD = 'uma-senha-de-teste';

test('sessão vale até expirar e só com a senha que a criou', () => {
  const now = 1000;
  const token = createSession(PASSWORD, now);
  assert.equal(validSession(token, PASSWORD, now + 1), true);
  assert.equal(validSession(token, PASSWORD, now + SESSION_MS), false);
  assert.equal(validSession(token, 'outra-senha-qualquer', now + 1), false);
});

test('sessão adulterada ou vazia é recusada', () => {
  const now = 1000;
  const [expiresAt, signature] = createSession(PASSWORD, now).split('.');
  assert.equal(validSession(`${Number(expiresAt) + 1}.${signature}`, PASSWORD, now), false);
  assert.equal(validSession('', PASSWORD, now), false);
  assert.equal(validSession('abc.def', PASSWORD, now), false);
});

test('limitador bloqueia no limite e libera depois da janela', () => {
  let clock = 0;
  const limiter = createLimiter({ limit: 2, windowMs: 1000, now: () => clock });
  assert.equal(limiter.hit('ip'), 0);
  assert.equal(limiter.blocked('ip'), 0);
  assert.equal(limiter.hit('ip'), 1);
  assert.equal(limiter.blocked('outro'), 0);
  clock = 1000;
  assert.equal(limiter.blocked('ip'), 0);
});

test('reset limpa as falhas', () => {
  const limiter = createLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
  limiter.hit('ip');
  limiter.reset('ip');
  assert.equal(limiter.blocked('ip'), 0);
});

test('cookie é HttpOnly, Strict, só em /api/admin e Secure em https', () => {
  const cookie = sessionCookie({ headers: { 'x-forwarded-proto': 'https' } }, 'abc', 60000);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\/api\/admin/);
  assert.match(cookie, /Secure/);
  assert.equal(readSession({ headers: { cookie: `x=1; ${cookie.split(';')[0]}` } }), 'abc');
});

test('clientIp usa o IP da plataforma', () => {
  assert.equal(clientIp({ headers: { 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' } }), '1.1.1.1');
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '2.2.2.2, 3.3.3.3' } }), '2.2.2.2');
});
