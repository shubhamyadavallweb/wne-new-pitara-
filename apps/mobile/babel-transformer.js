const upstreamTransformer = require('@react-native/metro-babel-transformer');

module.exports.transform = function({ src, filename, ...rest }) {
  // Handle React Native private specs imports
  if (filename.includes('react-native/Libraries/') && src.includes('../../../src/private/specs/')) {
    // Replace the problematic imports with empty exports
    src = src.replace(
      /export \* from '\.\.\/\.\.\/\.\.\/src\/private\/specs\/modules\/[^']+'/g,
      '// Removed private spec export'
    );
    src = src.replace(
      /import .+ from '\.\.\/\.\.\/\.\.\/src\/private\/specs\/modules\/[^']+'/g,
      'const NativeModule = {}; export default NativeModule'
    );
  }
  
  return upstreamTransformer.transform({ src, filename, ...rest });
}; 