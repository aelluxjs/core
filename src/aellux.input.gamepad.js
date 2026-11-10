/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
import { createGamepadAdapter, identifyGamepadFamily } from "./internal/create-input-gamepad.js";
const api = (typeof globalThis !== "undefined" ? globalThis : window).aelluxJs;
api.registry.inputAdapters = api.registry.inputAdapters || {};
api.registry.inputAdapters.gamepad = ({ root, emit, changed, identify }) =>
  createGamepadAdapter(api, root, emit, changed, id => identify(id) || identifyGamepadFamily(id));
