/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

(function () {
  "use strict";

  const moduleName = "preferences";
  Aellux.uxmRegister(moduleName, { init, destroy, update, get, set });


  const userPreferences = Object.create(null);
  const defaultPreferences = Object.create(null);
  const computedPreferences = Object.create(null);

  const attr = {
    preference: Aellux.attr("preference"),
    option: Aellux.attr("option"),
    label: Aellux.attr("label"),
    next: Aellux.attr("next"),
    prev: Aellux.attr("prev"),
    ready: Aellux.attr("ready"),
  }

  const className = {
    active: Aellux.className("active")
  }

  async function init() {
    window.addEventListener("storage", function (event) {
      if (event.key !== "AelluxPreferences") return;
      const newPreferences = new URLSearchParams(event.newValue || "");
      newPreferences.forEach((value, key) => userPreferences[key] = value);
      update();
    });

    //Watch device changes
    const allQueries = Aellux.options.preferencesMediaQueries;
    Object.values(allQueries).forEach((queries) =>
      Object.values(queries).forEach((query) =>
        query.addEventListener("change", update)
      )
    );

    //Default values
    Object.entries(Aellux.options.preferencesOptions)
      .forEach(([param, options]) => defaultPreferences[param] = options[0]);

    loadUserPreferences();

    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        update,
        { once: true }
      );
    } else {
      update();
    }
  }

  async function destroy() {

  }

  function update() {
    Object.assign(computedPreferences, defaultPreferences, userPreferences);

    Aellux.updatePreferencesAttributesHTML(computedPreferences);

    //Configure toggle buttons & events
    preferenceContainersUpdate();

    Aellux.dispatch("PreferencesChange");
  }

  function get(preference) {
    const key = toCamelCase(preference);
    return computedPreferences[key];
  }

  function set(preference, value) {
    const key = toCamelCase(preference);
    if (userPreferences[key] === value) return;
    userPreferences[key] = value;
    saveUserPreferences();
  }

  function saveUserPreferences() {
    Aellux.persist.preferences.setObject(userPreferences);
  }

  function loadUserPreferences() {
    Object.assign(userPreferences, Aellux.persist.preferences.getObject());
  }

  function preferenceContainersUpdate() {
    document.querySelectorAll(`[${attr.preference}]`)
      .forEach(container => {
        const ready = container.getAttribute(attr.ready);
        if (!ready) { setupPreferenceContainer(container); }

        const preference = container.getAttribute(attr.preference);
        const elements = container.querySelectorAll(`[${attr.option}]`);
        const selectedLabel = container.querySelector(`[${attr.label}]`);
        elements.forEach(element => {
          const value = element.getAttribute(attr.option);
          const selected = value === get(preference);
          element.classList.toggle(className.active, selected);
          if (selectedLabel && selected) {
            if (selectedLabel.value) { selectedLabel.value = element.innerText; }
            else { selectedLabel.innerHTML = element.innerHTML; }
          }
        });
      });
  }

  function setupPreferenceContainer(container) {
    container.addEventListener("click", onContainerClick);
    container.setAttribute(attr.ready, "");
  }

  function onContainerClick(event) {
    const container = event.currentTarget;
    if (!event.target) return;
    const optionButton = event.target.closest(`[${attr.option}]`);
    const buttonNext = event.target.closest(`[${attr.next}]`);
    const buttonPrev = event.target.closest(`[${attr.prev}]`);
    if (optionButton) {
      const preference = container.getAttribute(attr.preference);
      const value = optionButton.getAttribute(attr.option);
      set(preference, value);
      update();
    } else if (buttonNext || buttonPrev) {
      const preference = container.getAttribute(attr.preference);
      const change = buttonNext ? 1 : -1;
      //TODO LIST OPTIONS
    }
  }

  function toCamelCase(name) { return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); };
  function fromCamelCase(name) { return name.replace(/([A-Z])/g, "-$1").toLowerCase(); };
})();
