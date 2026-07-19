(async () => {
  try {
    const ping = await fetch('http://127.0.0.1:3000/api/queue/ping');
    console.log('PING', await ping.text());
    const enqueue = await fetch('http://127.0.0.1:3000/api/queue/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-job', data: { hello: 'world' } })
    });
    console.log('ENQUEUE', await enqueue.text());
  } catch (err) {
    console.error('FAILED', err);
    process.exit(1);
  }
})();
