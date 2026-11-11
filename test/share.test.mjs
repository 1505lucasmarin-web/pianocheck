import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeCfg, decodeCfg, buildShareUrl, extractToken, maskKey, validateCfg } from '../js/share.js';

const cfg = { provider: 'anthropic', apiKey: 'sk-ant-api03-AbC_123-xyz', model: 'claude-sonnet-4' };
const b64u = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o), 'utf8').toString('base64url');

test('ida y vuelta', () => {
  const r = decodeCfg(encodeCfg(cfg));
  assert.equal(r.ok, true);
  assert.deepEqual(r.cfg, cfg);
  assert.deepEqual(decodeCfg(encodeCfg({ provider: 'gemini', apiKey: 'AIzaSyFAKEKEY12345', model: '' })).cfg, { provider: 'gemini', apiKey: 'AIzaSyFAKEKEY12345', model: '' });
});

test('el token es base64url (sin + / =) y el enlace usa fragmento, nunca query', () => {
  const url = buildShareUrl('https://x.github.io', '/pianocheck/', cfg);
  assert.match(url, /^https:\/\/x\.github\.io\/pianocheck\/#cfg=[A-Za-z0-9_-]+$/);
  assert.ok(!url.includes('?'));
  assert.deepEqual(decodeCfg(extractToken(url)).cfg, cfg);
  assert.equal(extractToken('hola'), null);
  assert.deepEqual(decodeCfg(extractToken('#cfg=' + encodeCfg(cfg))).cfg, cfg);
});

test('campos extra se ignoran y no viajan', () => {
  const r = decodeCfg(b64u({ v: 1, provider: 'anthropic', apiKey: 'sk-ant-12345678', model: '', onscreenKeyboard: true, extra: { a: 1 } }));
  assert.deepEqual(r, { ok: true, cfg: { provider: 'anthropic', apiKey: 'sk-ant-12345678', model: '' } });
  const tok = encodeCfg({ ...cfg, micSensitivity: 0.9, seenConnectHint: true });
  assert.deepEqual(JSON.parse(Buffer.from(tok, 'base64url').toString()), { v: 1, ...cfg });
});

test('versión desconocida, datos corruptos y valores inválidos → error', () => {
  assert.equal(decodeCfg(b64u({ v: 2, provider: 'anthropic', apiKey: 'sk-ant-12345678' })).ok, false);
  assert.equal(decodeCfg(b64u({ provider: 'anthropic', apiKey: 'sk-ant-12345678' })).ok, false);
  assert.equal(decodeCfg('esto no es base64!').ok, false);
  assert.equal(decodeCfg('').ok, false);
  assert.equal(decodeCfg(null).ok, false);
  assert.equal(decodeCfg(b64u('{no es json')).ok, false);
  assert.equal(decodeCfg(b64u('[1,2]')).ok, false);
  assert.equal(decodeCfg(encodeCfg(cfg).slice(0, -7)).ok, false);
  assert.equal(decodeCfg(b64u({ v: 1, provider: 'openai', apiKey: 'sk-ant-12345678' })).ok, false);
  assert.equal(decodeCfg(b64u({ v: 1, provider: 'anthropic', apiKey: 'corta' })).ok, false);
  assert.equal(decodeCfg(b64u({ v: 1, provider: 'anthropic', apiKey: 'con espacios adentro 1234' })).ok, false);
  assert.equal(decodeCfg(b64u({ v: 1, provider: 'anthropic', apiKey: 'sk-ant-12345678', model: 5 })).ok, false);
  assert.equal(decodeCfg('A'.repeat(5000)).ok, false);
  assert.throws(() => encodeCfg({ provider: 'x', apiKey: 'y' }));
  assert.equal(validateCfg(null).ok, false);
});

test('maskKey muestra sólo los últimos 4', () => {
  assert.equal(maskKey('sk-ant-api03-AbC_123-xyz'), '••••-xyz'.replace('-xyz', '-xyz'));
  assert.equal(maskKey('corta'), '••••');
  assert.ok(!maskKey('sk-ant-SECRETO-1234').includes('SECRETO'));
});
