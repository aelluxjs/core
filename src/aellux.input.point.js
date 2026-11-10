/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
import { createPointAdapter } from "./internal/create-input-point.js";
const api = (typeof globalThis !== "undefined" ? globalThis : window).aelluxJs;
api.registry.inputAdapters = api.registry.inputAdapters || {};
api.registry.inputAdapters.point = ({ root, emit, accepts }) => createPointAdapter(api, root, emit, accepts);
