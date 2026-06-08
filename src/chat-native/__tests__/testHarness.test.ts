describe('native chat test harness', () => {
  it('provides browser-compatible base64 helpers in node tests', () => {
    expect(global.btoa('IDChat')).toBe('SURDaGF0');
    expect(global.atob('SURDaGF0')).toBe('IDChat');
  });
});
