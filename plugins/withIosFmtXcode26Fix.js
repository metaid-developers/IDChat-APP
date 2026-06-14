const { createRunOncePlugin, withPodfile } = require('expo/config-plugins');

const GENERATED_BEGIN = '# @generated begin IDChat fmt Xcode 26 consteval fix';
const GENERATED_END = '# @generated end IDChat fmt Xcode 26 consteval fix';

const PATCH_SNIPPET = `    ${GENERATED_BEGIN}
      fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
      if File.exist?(fmt_base)
        content = File.read(fmt_base)
        patched = content.gsub(/^#\\s*define FMT_USE_CONSTEVAL 1$/, '#  define FMT_USE_CONSTEVAL 0')
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
      ${GENERATED_END}`;

function addFmtXcode26Fix(contents) {
  if (contents.includes(GENERATED_BEGIN)) {
    return contents;
  }

  const primaryAnchor = '    # This is necessary for Xcode 14';
  if (contents.includes(primaryAnchor)) {
    return contents.replace(primaryAnchor, `${PATCH_SNIPPET}\n\n${primaryAnchor}`);
  }

  const fallbackAnchor = /\n\s+end\nend\s*$/;
  if (contents.includes('post_install do |installer|') && fallbackAnchor.test(contents)) {
    return contents.replace(fallbackAnchor, `\n${PATCH_SNIPPET}$&`);
  }

  throw new Error('Unable to insert IDChat fmt Xcode 26 fix into Podfile');
}

function withIosFmtXcode26Fix(config) {
  return withPodfile(config, (modConfig) => {
    modConfig.modResults.contents = addFmtXcode26Fix(modConfig.modResults.contents);
    return modConfig;
  });
}

module.exports = createRunOncePlugin(withIosFmtXcode26Fix, 'with-ios-fmt-xcode26-fix', '1.0.0');
module.exports.addFmtXcode26Fix = addFmtXcode26Fix;
module.exports.GENERATED_BEGIN = GENERATED_BEGIN;
module.exports.GENERATED_END = GENERATED_END;
