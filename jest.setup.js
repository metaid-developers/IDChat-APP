const { Buffer } = require('buffer');

global.Buffer = Buffer;
global.atob = (input) => Buffer.from(input, 'base64').toString('binary');
global.btoa = (input) => Buffer.from(input, 'binary').toString('base64');

jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');

  return {
    Image: React.forwardRef((props, ref) => React.createElement(Image, { ...props, ref })),
  };
});
