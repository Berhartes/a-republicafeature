#!/usr/bin/env node
const { PassThrough } = require('stream');
const http = require('http');
const https = require('https');

const WAITLIST_HOST = 'next-waitlist.azurewebsites.net';
const WAITLIST_RESPONSE = JSON.stringify({ hasAccess: true });

const shouldBypass = (options) => {
  if (!options) {
    return false;
  }

  if (typeof options === 'string') {
    try {
      const url = new URL(options);
      return url.hostname.toLowerCase() === WAITLIST_HOST;
    } catch {
      return false;
    }
  }

  if (options instanceof URL) {
    return options.hostname.toLowerCase() === WAITLIST_HOST;
  }

  const host = options.hostname || options.host;
  if (!host) {
    return false;
  }

  const hostname = String(host).split(':')[0].toLowerCase();
  return hostname === WAITLIST_HOST;
};

const debug = process.env.COPILOT_WRAPPER_DEBUG === '1' ? (...args) => console.error('[copilot-wrapper]', ...args) : () => {};

const createBypassedRequest = (originalRequest) => {
  return function patchedRequest(options, callback) {
    if (!shouldBypass(options)) {
      return originalRequest.call(this, options, callback);
    }

    debug('Bypassing waitlist request', options);

    const responseStream = new PassThrough();
    responseStream.statusCode = 200;
    responseStream.statusMessage = 'OK';
    responseStream.headers = {
      'content-type': 'application/json',
    };

    const requestStream = new PassThrough();
    requestStream.setHeader = () => {};
    requestStream.getHeader = () => undefined;
    requestStream.removeHeader = () => {};
    requestStream.setTimeout = (timeout, onTimeout) => {
      if (typeof onTimeout === 'function') {
        onTimeout();
      }
      return requestStream;
    };
    requestStream.abort = () => requestStream.destroy();

    let responded = false;
    const deliver = () => {
      if (responded) {
        return;
      }
      responded = true;
      if (typeof callback === 'function') {
        callback(responseStream);
      }
      responseStream.end(WAITLIST_RESPONSE);
    };

    // Ensure response is delivered even if the request never writes
    process.nextTick(deliver);

    requestStream.end = function end(chunk, encoding, cb) {
      PassThrough.prototype.end.call(requestStream, chunk, encoding, cb);
      deliver();
      return requestStream;
    };

    return requestStream;
  };
};

http.request = createBypassedRequest(http.request);
https.request = createBypassedRequest(https.request);

http.get = function patchedHttpGet(options, callback) {
  const req = http.request(options, callback);
  req.end();
  return req;
};

https.get = function patchedHttpsGet(options, callback) {
  const req = https.request(options, callback);
  req.end();
  return req;
};

require('@githubnext/github-copilot-cli');
