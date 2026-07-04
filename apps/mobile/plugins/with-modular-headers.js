// Podfile에 `use_modular_headers!`를 주입하는 Expo config plugin.
//
// 이유: @react-native-google-signin이 끌어오는 Swift pod(AppCheckCore)가
// module map을 정의하지 않는 GoogleUtilities/RecaptchaInterop에 의존하는데,
// 기본 static 링크에서는 이를 Swift에서 import할 수 없어 pod install이 실패한다.
// use_modular_headers!는 모든 pod이 module map을 생성하게 해 이 문제를 해결한다.
//
// CNG(prebuild)가 Podfile을 매번 재생성하므로 dangerous mod로 매 prebuild마다 주입.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (!contents.includes('use_modular_headers!')) {
        contents = contents.replace(
          /use_expo_modules!/,
          'use_expo_modules!\n  use_modular_headers!',
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
