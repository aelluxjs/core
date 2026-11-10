/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createAelluxApi } from "./internal/aellux-api-integration.js";
import { createAelluxConstants } from "./internal/create-aellux-constants.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;
const aelluxJs = root.aelluxJs || createAelluxApi(root, createAelluxConstants());

root.aelluxJs = aelluxJs;
root[aelluxJs.shortJSName] = aelluxJs;

export default aelluxJs;
