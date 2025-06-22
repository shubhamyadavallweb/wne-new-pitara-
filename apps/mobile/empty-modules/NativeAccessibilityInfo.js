// Empty module stub for React Native's NativeAccessibilityInfo
// This is required for React Native 0.74.x compatibility

const NativeAccessibilityInfo = {
  announceForAccessibility: () => {},
  announceForAccessibilityWithOptions: () => {},
  setAccessibilityFocus: () => {},
  getRecommendedTimeoutMillis: () => Promise.resolve(0),
  isAccessibilityServiceEnabled: () => Promise.resolve(false),
  isBoldTextEnabled: () => Promise.resolve(false),
  isGrayscaleEnabled: () => Promise.resolve(false),
  isInvertColorsEnabled: () => Promise.resolve(false),
  isReduceMotionEnabled: () => Promise.resolve(false),
  isReduceTransparencyEnabled: () => Promise.resolve(false),
  isScreenReaderEnabled: () => Promise.resolve(false),
  isSpeakScreenEnabled: () => Promise.resolve(false),
  isSpeakSelectionEnabled: () => Promise.resolve(false),
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  isHighTextContrastEnabled: () => Promise.resolve(false),
  prefersCrossFadeTransitions: () => Promise.resolve(false),
};

// Export for both named and default imports
export default NativeAccessibilityInfo;
export { NativeAccessibilityInfo }; 