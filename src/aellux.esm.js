/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createAelluxApi } from "./internal/aellux-api-integration.js";
import { createAelluxConstants } from "./internal/create-aellux-constants.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;
const AelluxJs = root.AelluxJs || createAelluxApi(root, createAelluxConstants());

root.AelluxJs = AelluxJs;
root[AelluxJs.shortJSName] = AelluxJs;

export default AelluxJs;
