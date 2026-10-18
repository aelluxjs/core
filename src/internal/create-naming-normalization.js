/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import utilsNameCase from "./utils-name-case.js";

// The returned functions are also used by the ES5 boot bundle.
export function createNamingNormalization(constants) {
  var fromCamelCase = utilsNameCase.fromCamelCase;
  var toCapitalized = utilsNameCase.toCapitalized;

  return {
    attr: function (name) {
      name = fromCamelCase(name);
      return "data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
    },
    className: function (name) {
      name = fromCamelCase(name);
      return constants.AELLUXJS_CLASS_NAME_PREFFIX.replace(/\?/, name);
    },
    cssVar: function (name) {
      name = fromCamelCase(name);
      return constants.AELLUXJS_CSS_VAR_PREFFIX.replace(/\?/, name);
    },
    extFilename: function (extensionName) {
      extensionName = fromCamelCase(extensionName);
      return "aellux." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "." + extensionName +
        (this.minified ? ".min.js" : ".js");
    },
    extName: function (filename) {
      return filename.replace(
        new RegExp("^.*aellux\\." + constants.AELLUXJS_EXT_SCRIPT_PREFIX +
          "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
        "$1"
      );
    },
    eventName: function (name) {
      if (/^[$#_!]/.test(name)) return name.slice(1).trim();
      var format = constants.AELLUXJS_EVENT_NAME_PREFFIX;
      var prefix = format.slice(0, format.indexOf("?"));
      if (name.indexOf(prefix) === 0) return name;
      return format.replace(/\?/, toCapitalized(name));
    }
  };
}
