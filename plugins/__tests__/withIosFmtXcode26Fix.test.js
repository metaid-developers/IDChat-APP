const {
  GENERATED_BEGIN,
  GENERATED_END,
  addFmtXcode26Fix,
} = require('../withIosFmtXcode26Fix');

const SAMPLE_PODFILE = `target 'IDChat' do
  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
    )

    # This is necessary for Xcode 14, because it signs resource bundles by default
    installer.target_installation_results.pod_target_installation_results
      .each do |pod_name, target_installation_result|
    end
  end
end
`;

describe('withIosFmtXcode26Fix', () => {
  it('injects the fmt patch before the existing Xcode 14 resource-bundle block', () => {
    const result = addFmtXcode26Fix(SAMPLE_PODFILE);

    expect(result).toContain(GENERATED_BEGIN);
    expect(result).toContain(GENERATED_END);
    expect(result).toContain("fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')");
    expect(result).toContain("patched = content.gsub(/^#\\s*define FMT_USE_CONSTEVAL 1$/, '#  define FMT_USE_CONSTEVAL 0')");
    expect(result.indexOf(GENERATED_BEGIN)).toBeLessThan(result.indexOf('# This is necessary for Xcode 14'));
  });

  it('is idempotent', () => {
    const once = addFmtXcode26Fix(SAMPLE_PODFILE);
    const twice = addFmtXcode26Fix(once);

    expect(twice).toBe(once);
    expect(twice.match(new RegExp(GENERATED_BEGIN, 'g'))).toHaveLength(1);
  });

  it('throws when the Podfile has no post_install block', () => {
    expect(() => addFmtXcode26Fix("target 'IDChat' do\nend\n")).toThrow(
      'Unable to insert IDChat fmt Xcode 26 fix into Podfile',
    );
  });
});
