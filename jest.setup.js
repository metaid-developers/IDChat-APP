const { Buffer } = require('buffer');

global.Buffer = Buffer;
global.atob = (input) => Buffer.from(input, 'base64').toString('binary');
global.btoa = (input) => Buffer.from(input, 'binary').toString('base64');
