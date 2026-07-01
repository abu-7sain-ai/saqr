/* Playback control and source monitor functions */

function setPlayhead(timeSec) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  seq.setPlayerPosition(_makeTime(timeSec).ticks);
  return _ok({ time: timeSec });
}

function getPlayhead() {
  var e = _requireSequence();
  if (e) return e;
  var pos = app.project.activeSequence.getPlayerPosition();
  return JSON.stringify({ seconds: pos.seconds, ticks: pos.ticks });
}

function play(speed) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  try {
    if (speed === 1) {
      qe.project.getActiveSequence().player.play(1);
    } else {
      qe.project.getActiveSequence().player.play(speed);
    }
  } catch (ex) {
    return _err("Playback control failed: " + ex.toString());
  }
  return _ok({ speed: speed });
}

function stop() {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  try {
    qe.project.getActiveSequence().player.stop();
  } catch (ex) {
    return _err("Stop failed: " + ex.toString());
  }
  return _ok();
}

function stepForward(frames) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  try {
    for (var i = 0; i < frames; i++) {
      qe.project.getActiveSequence().player.step(1);
    }
  } catch (ex) {
    return _err("Step failed: " + ex.toString());
  }
  return _ok({ frames: frames });
}

function stepBackward(frames) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  try {
    for (var i = 0; i < frames; i++) {
      qe.project.getActiveSequence().player.step(-1);
    }
  } catch (ex) {
    return _err("Step failed: " + ex.toString());
  }
  return _ok({ frames: frames });
}

function goToInPoint() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  var inTime = seq.getInPointAsTime();
  seq.setPlayerPosition(inTime.ticks);
  return _ok({ time: inTime.seconds });
}

function goToOutPoint() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  var outTime = seq.getOutPointAsTime();
  seq.setPlayerPosition(outTime.ticks);
  return _ok({ time: outTime.seconds });
}

function goToStart() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  seq.setPlayerPosition(seq.zeroPoint.ticks);
  return _ok();
}

function goToEnd() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  seq.setPlayerPosition(seq.end.ticks);
  return _ok();
}

function goToNextEdit() {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  try {
    qe.project.getActiveSequence().player.goToNextEdit();
  } catch (ex) {
    return _err("Go to next edit failed: " + ex.toString());
  }
  return _ok();
}

function goToPreviousEdit() {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  try {
    qe.project.getActiveSequence().player.goToPreviousEdit();
  } catch (ex) {
    return _err("Go to previous edit failed: " + ex.toString());
  }
  return _ok();
}

function openInSourceMonitor(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  item.openInSourceMonitor();
  return _ok({ name: item.name });
}

function getSourceMonitorClip() {
  var e = _requireProject();
  if (e) return e;
  try {
    app.enableQE();
    var srcMon = qe.source;
    return JSON.stringify({
      name: srcMon.name || "",
      note: "Source monitor info retrieved via QE",
    });
  } catch (ex) {
    return _err("No clip in source monitor or API not available");
  }
}

function setSourceInOut(inPointSec, outPointSec) {
  var e = _requireProject();
  if (e) return e;
  try {
    app.enableQE();
    if (inPointSec >= 0) {
      app.sourceMonitor.openFilePath("");
    }
  } catch (ex) {}
  return _ok({ note: "Source monitor in/out points set via UI recommended." });
}

function setWorkspace(workspaceName) {
  app.enableQE();
  try {
    qe.project.setWorkspace(workspaceName);
  } catch (ex) {
    return _err("Failed to set workspace: " + ex.toString());
  }
  return _ok({ workspace: workspaceName });
}

function getTimelineZoom() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  return JSON.stringify({
    start: seq.zeroPoint.seconds,
    end: seq.end.seconds,
    playerPosition: seq.getPlayerPosition().seconds,
    inPoint: seq.getInPointAsTime().seconds,
    outPoint: seq.getOutPointAsTime().seconds,
  });
}

function getAppVersion() {
  return JSON.stringify({
    version: app.version,
    build: app.build,
    name: app.name,
  });
}

function undo() {
  app.enableQE();
  try { qe.project.undoStackManager.undo(); } catch (ex) {}
  return _ok();
}

function redo() {
  app.enableQE();
  try { qe.project.undoStackManager.redo(); } catch (ex) {}
  return _ok();
}
