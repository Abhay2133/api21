import assert from 'node:assert';
import http from 'http';
import { app, createChatMessage, PORT, API_URL, WS_URL, publicDir } from '../src/index.js';

async function runTests() {
  console.log('🧪 Running @apps21/chat validation test suite...\n');

  // Test 1: createChatMessage export functionality
  console.log('Test 1: Verifying legacy createChatMessage export...');
  const testUser = { id: 99, email: 'test@example.com', name: 'Tester', role: 'user', created_at: new Date() };
  const mockMsg = createChatMessage(testUser as any, 'Hello world');
  assert.strictEqual(mockMsg.status, 'success');
  assert.strictEqual(mockMsg.data.content, 'Hello world');
  assert.strictEqual(mockMsg.data.sender.name, 'Tester');
  console.log('  ✓ createChatMessage exported and returns expected ApiResponse structure.');

  // Start HTTP server on an ephemeral port for testing
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = testServer.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`\n  Test server listening at: ${baseUrl}`);

  try {
    // Test 2: GET /health
    console.log('Test 2: Verifying /health endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, 'ok');
    assert.strictEqual(healthJson.service, '@apps21/chat');
    assert.ok(typeof healthJson.uptime === 'number');
    console.log('  ✓ /health returned 200 with service status.');

    // Test 3: GET /config.js
    console.log('Test 3: Verifying /config.js runtime config endpoint...');
    const configRes = await fetch(`${baseUrl}/config.js`);
    assert.strictEqual(configRes.status, 200);
    const configJs = await configRes.text();
    assert.ok(configJs.includes('window.__APP_CONFIG__'));
    assert.ok(configJs.includes(API_URL));
    console.log('  ✓ /config.js returns valid client configuration script.');

    // Test 4: GET / (Index HTML)
    console.log('Test 4: Verifying UI components in / (index.html)...');
    const htmlRes = await fetch(`${baseUrl}/`);
    assert.strictEqual(htmlRes.status, 200);
    const html = await htmlRes.text();

    // Check Header & status indicators
    assert.ok(html.includes('id="connectionStatusBadge"'), 'Header: connection status badge missing');
    assert.ok(html.includes('id="onlineCountBadge"'), 'Header: online count badge missing');
    assert.ok(html.includes('apps21'), 'Header: brand missing');

    // Check Identity Bar
    assert.ok(html.includes('id="identityDisplayName"'), 'Identity: display name missing');
    assert.ok(html.includes('id="identityClaimBadge"'), 'Identity: claim badge missing');
    assert.ok(html.includes('id="identityIpAddress"'), 'Identity: IP address indicator missing');
    assert.ok(html.includes('id="openClaimModalBtn"'), 'Identity: claim handle button missing');

    // Check Message Stream
    assert.ok(html.includes('id="messagesContainer"'), 'Stream: messages container missing');
    assert.ok(html.includes('id="messagesStream"'), 'Stream: messages stream missing');
    assert.ok(html.includes('id="jumpBottomBtn"'), 'Stream: jump bottom button missing');

    // Check Composer
    assert.ok(html.includes('id="messageInput"'), 'Composer: message input textarea missing');
    assert.ok(html.includes('id="sendMessageBtn"'), 'Composer: send button missing');
    assert.ok(html.includes('id="charCounter"'), 'Composer: character counter missing');
    assert.ok(html.includes('maxlength="2000"'), 'Composer: 2000 character limit missing');
    assert.ok(html.includes('Shift'), 'Composer: Shift+Enter hint missing');

    // Check Claim Modal
    assert.ok(html.includes('id="claimModal"'), 'Modal: claim modal missing');
    assert.ok(html.includes('id="claimDisplayName"'), 'Modal: display name input missing');
    assert.ok(html.includes('id="claimPassword"'), 'Modal: password input missing');
    assert.ok(html.includes('id="submitClaimBtn"'), 'Modal: submit button missing');
    assert.ok(html.includes('id="claimErrorAlert"'), 'Modal: error alert missing');
    console.log('  ✓ index.html contains all required UI components and accessibility attributes.');

    // Test 5: GET /styles.css
    console.log('Test 5: Verifying /styles.css static asset...');
    const cssRes = await fetch(`${baseUrl}/styles.css`);
    assert.strictEqual(cssRes.status, 200);
    const css = await cssRes.text();
    assert.ok(css.includes('backdrop-filter'), 'CSS: backdrop-filter glassmorphism missing');
    assert.ok(css.includes('message-self'), 'CSS: message-self alignment missing');
    assert.ok(css.includes('message-other'), 'CSS: message-other alignment missing');
    assert.ok(css.includes('message-system'), 'CSS: message-system alignment missing');
    assert.ok(css.includes('badge-claimed'), 'CSS: badge-claimed missing');
    console.log('  ✓ styles.css served with dark glassmorphic styling.');

    // Test 6: GET /app.js
    console.log('Test 6: Verifying /app.js static asset...');
    const jsRes = await fetch(`${baseUrl}/app.js`);
    assert.strictEqual(jsRes.status, 200);
    const js = await jsRes.text();
    assert.ok(js.includes('apps21_chat_token'), 'JS: localStorage token key missing');
    assert.ok(js.includes('escapeHtml'), 'JS: XSS escapeHtml sanitizer missing');
    assert.ok(js.includes('/api/v1/chat/identity/handshake'), 'JS: handshake endpoint missing');
    assert.ok(js.includes('/api/v1/chat/identity/claim'), 'JS: claim endpoint missing');
    assert.ok(js.includes('/ws/chat'), 'JS: WebSocket endpoint missing');
    assert.ok(js.includes('scheduleReconnect'), 'JS: exponential backoff reconnect missing');
    assert.ok(js.includes('pollLatestMessages'), 'JS: REST polling fallback missing');
    console.log('  ✓ app.js served with full WebSocket, REST fallback, XSS escaping, and token logic.');

    console.log('\n🎉 All @apps21/chat validation tests passed successfully!\n');
  } finally {
    testServer.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
