const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MIN_AUTOMACAO_TOKEN_LENGTH, SESSION_MS, automacaoAccount, clientIp, createLimiter, createSession, parseAccounts, readSession, sessionCookie, validSession,
} = require('./adminAuth');

const PASSWORD = 'uma-senha-de-teste';

test('sessão vale até expirar, só com a senha que a criou e guarda a marca', () => {
  const now = 1000;
  const token = createSession(PASSWORD, 'csplay', now);
  assert.equal(validSession(token, PASSWORD, now + 1), 'csplay');
  assert.equal(validSession(token, PASSWORD, now + SESSION_MS), null);
  assert.equal(validSession(token, 'outra-senha-qualquer', now + 1), null);
  assert.equal(validSession(createSession(PASSWORD, undefined, now), PASSWORD, now), 'agtv');
});

test('sessão adulterada, com marca trocada ou vazia é recusada', () => {
  const now = 1000;
  const [expiresAt, brand, signature] = createSession(PASSWORD, 'valk', now).split('.');
  assert.equal(brand, 'valk');
  assert.equal(validSession(`${Number(expiresAt) + 1}.${brand}.${signature}`, PASSWORD, now), null);
  assert.equal(validSession(`${expiresAt}.agtv.${signature}`, PASSWORD, now), null);
  assert.equal(validSession('', PASSWORD, now), null);
  assert.equal(validSession('abc.def', PASSWORD, now), null);
});

test('ADMIN_CONTAS liga cada e-mail a uma marca', () => {
  const accounts = parseAccounts(' Dono@Mail.com=agtv; amigo@mail.com = csplay,outro@mail.com=valk, ruim, x=@@ ');
  assert.equal(accounts.get('dono@mail.com'), 'agtv');
  assert.equal(accounts.get('amigo@mail.com'), 'csplay');
  assert.equal(accounts.get('outro@mail.com'), 'valk');
  assert.equal(accounts.size, 3);
  assert.equal(parseAccounts(undefined).size, 0);
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

const TOKEN = 'token-da-automacao-com-mais-de-32-caracteres';
const ACCOUNTS = parseAccounts('dono@mail.com=agtv;amigo@mail.com=csplay');
const viaProxy = (headers) => automacaoAccount({ headers }, { token: TOKEN, accounts: ACCOUNTS });

test('sem o cabeçalho do token, o login pelo AGTV Automação não entra em jogo', () => {
  assert.equal(viaProxy({}), null);
  assert.equal(viaProxy({ 'x-automacao-email': 'dono@mail.com' }), null);
});

test('token certo entra como a conta do e-mail, com a marca dela', () => {
  assert.deepEqual(viaProxy({ 'x-automacao-token': TOKEN, 'x-automacao-email': ' Amigo@Mail.com ' }), { email: 'amigo@mail.com', brand: 'csplay' });
  assert.deepEqual(viaProxy({ 'x-automacao-token': TOKEN, 'x-automacao-email': 'dono@mail.com' }), { email: 'dono@mail.com', brand: 'agtv' });
});

test('token errado dá 401; e-mail sem conta ou vazio dá 403', () => {
  assert.deepEqual(viaProxy({ 'x-automacao-token': `${TOKEN}x`, 'x-automacao-email': 'dono@mail.com' }), { status: 401 });
  assert.deepEqual(viaProxy({ 'x-automacao-token': '', 'x-automacao-email': 'dono@mail.com' }), { status: 401 });
  assert.deepEqual(viaProxy({ 'x-automacao-token': TOKEN, 'x-automacao-email': 'estranho@mail.com' }), { status: 403 });
  assert.deepEqual(viaProxy({ 'x-automacao-token': TOKEN }), { status: 403 });
});

test('sem AUTOMACAO_TOKEN (ou curto demais) ninguém entra pelo proxy', () => {
  const headers = { 'x-automacao-token': 'curto', 'x-automacao-email': 'dono@mail.com' };
  assert.deepEqual(automacaoAccount({ headers }, { token: undefined, accounts: ACCOUNTS }), { status: 503 });
  assert.deepEqual(automacaoAccount({ headers }, { token: 'curto', accounts: ACCOUNTS }), { status: 503 });
  assert.equal(MIN_AUTOMACAO_TOKEN_LENGTH, 32);
});
