/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generateFeedbackCSS(AelluxJs) {
  const motions = {
    shake: {
      duration: "500ms",
      frames: `
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-8px); }
        40%, 80% { transform: translateX(8px); }
      `
    },
    yes: {
      duration: "550ms",
      frames: `
        0%, 100% { transform: translateY(0) rotate(0); }
        30%, 70% { transform: translateY(5px) rotate(2deg); }
        50% { transform: translateY(-2px) rotate(-1deg); }
      `
    },
    no: {
      duration: "550ms",
      frames: `
        0%, 100% { transform: translateX(0) rotate(0); }
        25%, 75% { transform: translateX(-5px) rotate(-3deg); }
        50% { transform: translateX(5px) rotate(3deg); }
      `
    },
    breathe: {
      duration: "900ms",
      frames: `
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.045); }
      `
    },
    tremble: {
      duration: "350ms",
      frames: `
        0%, 100% { transform: translate(0, 0); }
        20%, 60% { transform: translate(-2px, 1px); }
        40%, 80% { transform: translate(2px, -1px); }
      `
    },
    pulse: {
      duration: "500ms",
      frames: `
        0%, 100% { transform: scale(1); }
        35% { transform: scale(1.12); }
        65% { transform: scale(0.97); }
      `
    },
    alert: {
      duration: "850ms",
      frames: `
        0%, 100% { transform: translateY(0) scale(1); }
        20%, 60% { transform: translateY(-8px) scale(1.06); }
        40%, 80% { transform: translateY(0) scale(1); }
      `
    }
  };
  const rules = [];
  for (const [motion, { duration, frames }] of Object.entries(motions)) {
    const name = AelluxJs.className(`feedback-motion-${motion}`);
    const declarations = frames.trim().split("\n").map(line => line.trim()).join("\n  ");
    rules.push(`.${name} {
  animation-name: ${name};
  animation-duration: ${duration};
  animation-timing-function: ease-in-out;
  animation-iteration-count: 1;
}
@keyframes ${name} {
  ${declarations}
}`);
  }
  const reducedMotion = AelluxJs.attr("reduced-motion");
  const selectors = Object.keys(motions)
    .map(motion => `html[${reducedMotion}="reduced"] .${AelluxJs.className(`feedback-motion-${motion}`)}`)
    .join(",\n");
  rules.push(`${selectors} {
  animation: none;
}`);
  return "/*! aellux.js Feedback Extension | SPDX-License-Identifier: Apache-2.0 */\n\n" +
    rules.join("\n\n") + "\n";
}
