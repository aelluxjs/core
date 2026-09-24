/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function createLayoutScheduler() {
  var readQueue = [];
  var updateQueue = [];

  var framePending = false;
  var phase = "idle";

  function scheduleFrame() {
    if (framePending || phase !== "idle") return;
    framePending = true;
    requestAnimationFrame(flushFrame);
  }

  function flushFrame() {
    framePending = false;

    phase = "read";
    var reads = readQueue.splice(0);
    for (var i = 0; i < reads.length; i++)
      runTask(reads[i]);

    Promise.resolve().then(function () {
      phase = "update";
      var updates = updateQueue.splice(0);
      for (var i = 0; i < updates.length; i++)
        runTask(updates[i]);

      phase = "idle";
      if (readQueue.length || updateQueue.length) scheduleFrame();
    });
  }

  function runTask(task) {
    try {
      task.resolve(task.callback());
    } catch (error) {
      task.reject(error);
    }
  }

  function queueTask(queue, callback) {
    var promise = new Promise(function (resolve, reject) {
      queue.push({
        callback: callback,
        resolve: resolve,
        reject: reject
      });
    });

    if (phase === "idle") scheduleFrame();
    return promise;
  }

  return Object.freeze({
    read: (callback) => queueTask(readQueue, callback),
    update: (callback) => queueTask(updateQueue, callback)
  });
}
