export const environment = {
  version: 'v4.25.0.0',
  versionBD: '4.25.0.0',
  API: {
    BASE: window.location.hostname === 'localhost' ? 'http://localhost:8098/api' : 'https://api.harmony.vpcrapps.com/api',
  },
  TESTING: true,
  production: false,
  appVersion: 'v2.0.57-stable',
  socket_url: window.location.hostname === 'localhost' ? 'ws://localhost:8098' : 'wss://api.harmony.vpcrapps.com'
};
