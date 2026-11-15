// Rota /api/admin/eu e login pelo AGTV Automação, chamando o handler de verdade (sem rede).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSession } = require('./adminAuth');

const PASSWORD = 'senha-de-teste-bem-longa';
const TOKEN = 'token-da-automacao-com-mais-de-32-caracteres';
process.env.ADMIN_PASSWORD = PASSWORD;
process.env.AUTOMACAO_TOKEN = TOKEN;
process.env.ADMIN_CONTAS = 'dono@mail.com=agtv;amigo@mail.com=valk';
const handler = require('../api/admin');

const call = async (url, headers = {}, method = 'GET') => {
  const res = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(text) { this.body = text || ''; },
  };
  await handler({ method, url, headers: { host: 'agtvcenas.com.br', ...headers }, socket: {} }, res);
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null, headers: res.headers };
};

const proxy = (email, token = TOKEN) => ({ 'x-automacao-token': token, 'x-automacao-email': email, 'x-real-ip': `ip-${email}` });

test('/api/admin/eu sem sessão e sem token responde 401', async () => {
  const { status } = await call('/api/admin/eu');
  assert.equal(status, 401);
});

test('/api/admin/eu com o token do proxy devolve a conta e a marca', async () => {
  const { status, json } = await call('/api/admin/eu', proxy('Amigo@mail.com'));
  assert.equal(status, 200);
  assert.deepEqual(json, { ok: true, marca: 'valk', email: 'amigo@mail.com', origem: 'automacao' });
  // O rewrite da Vercel chega como ?rota=eu.
  const rewritten = await call('/api/admin?rota=eu', proxy('dono@mail.com'));
  assert.equal(rewritten.json.marca, 'agtv');
});

test('/api/admin/eu com cookie de sessão continua valendo', async () => {
  const cookie = `agtv_admin=${createSession(PASSWORD, 'agtv')}`;
  const { status, json } = await call('/api/admin/eu', { cookie });
  assert.equal(status, 200);
  assert.equal(json.origem, 'sessao');
  assert.equal(json.marca, 'agtv');
});

test('token errado dá 401 e e-mail sem conta dá 403, em qualquer rota do painel', async () => {
  assert.equal((await call('/api/admin/eu', proxy('dono@mail.com', `${TOKEN}errado`))).status, 401);
  assert.equal((await call('/api/admin/eu', proxy('estranho@mail.com'))).status, 403);
  assert.equal((await call('/api/admin', proxy('estranho@mail.com'))).status, 403);
  assert.equal((await call('/api/admin', { ...proxy('estranho@mail.com'), 'x-admin-acao': 'contas' })).status, 403);
});

test('pelo proxy, só o dono (marca AGTV) vê as contas, como no login com senha', async () => {
  const owner = await call('/api/admin', { ...proxy('dono@mail.com'), 'x-admin-acao': 'contas' });
  assert.equal(owner.status, 200);
  assert.equal(owner.json.accounts.length, 2);
  const other = await call('/api/admin', { ...proxy('amigo@mail.com'), 'x-admin-acao': 'contas' });
  assert.equal(other.status, 403);
});

test('/api/admin/eu só aceita GET', async () => {
  assert.equal((await call('/api/admin/eu', proxy('dono@mail.com'), 'POST')).status, 405);
});
