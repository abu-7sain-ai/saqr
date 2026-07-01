/* Sequence management functions */

function getSequences() {
  var e = _requireProject();
  if (e) return e;
  var proj = app.project;
  var sequences = [];
  for (var i = 0; i < proj.sequences.numSequences; i++) {
    var seq = proj.sequences[i];
    sequences.push({
      index: i,
      name: seq.name,
      id: seq.sequenceID,
      numVideoTracks: seq.videoTracks.numTracks,
      numAudioTracks: seq.audioTracks.numTracks,
      timebase: seq.timebase,
      end: seq.end.seconds,
    });
  }
  return JSON.stringify(sequences);
}

function getActiveSequence() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  var videoTracks = [];
  for (var i = 0; i < seq.videoTracks.numTracks; i++) {
    var track = seq.videoTracks[i];
    videoTracks.push({
      index: i,
      name: track.name,
      numClips: track.clips.numItems,
      muted: track.isMuted(),
      locked: track.isLocked(),
    });
  }

  var audioTracks = [];
  for (var i = 0; i < seq.audioTracks.numTracks; i++) {
    var track = seq.audioTracks[i];
    audioTracks.push({
      index: i,
      name: track.name,
      numClips: track.clips.numItems,
      muted: track.isMuted(),
      locked: track.isLocked(),
    });
  }

  return JSON.stringify({
    name: seq.name,
    id: seq.sequenceID,
    timebase: seq.timebase,
    frameSizeHorizontal: seq.frameSizeHorizontal,
    frameSizeVertical: seq.frameSizeVertical,
    videoTracks: videoTracks,
    audioTracks: audioTracks,
    playerPosition: seq.getPlayerPosition().seconds,
    inPoint: seq.getInPointAsTime().seconds,
    outPoint: seq.getOutPointAsTime().seconds,
    end: seq.end.seconds,
    zeroPoint: seq.zeroPoint.seconds,
  });
}

function setActiveSequence(sequenceName, sequenceIndex) {
  var e = _requireProject();
  if (e) return e;
  var proj = app.project;

  if (sequenceIndex >= 0) {
    if (sequenceIndex >= proj.sequences.numSequences) return _err("Invalid sequence index");
    app.project.openSequence(proj.sequences[sequenceIndex].sequenceID);
    return _ok({ name: proj.sequences[sequenceIndex].name });
  }

  if (sequenceName && sequenceName !== "") {
    for (var i = 0; i < proj.sequences.numSequences; i++) {
      if (proj.sequences[i].name === sequenceName) {
        app.project.openSequence(proj.sequences[i].sequenceID);
        return _ok({ name: sequenceName });
      }
    }
    return _err("Sequence not found: " + sequenceName);
  }

  return _err("Provide sequenceName or sequenceIndex");
}

function createSequence(name, presetPath) {
  var e = _requireProject();
  if (e) return e;
  if (presetPath && presetPath !== "") {
    app.project.createNewSequenceFromPreset(presetPath, name);
  } else {
    app.project.createNewSequence(name, "mcpSequence");
  }
  return _ok({ name: name });
}

function createSequenceFromClip(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  app.project.createNewSequenceFromClips(item.name, [item], app.project.rootItem);
  return _ok({ name: item.name });
}

function cloneSequence(sequenceName, newName) {
  var e = _requireProject();
  if (e) return e;
  var seq = null;
  if (sequenceName && sequenceName !== "") {
    for (var i = 0; i < app.project.sequences.numSequences; i++) {
      if (app.project.sequences[i].name === sequenceName) {
        seq = app.project.sequences[i];
        break;
      }
    }
    if (!seq) return _err("Sequence not found: " + sequenceName);
  } else {
    seq = app.project.activeSequence;
  }
  if (!seq) return _err("No sequence to clone");
  seq.clone();
  return _ok({ cloned: seq.name });
}

function deleteSequence(sequenceId) {
  var e = _requireProject();
  if (e) return e;
  for (var i = 0; i < app.project.sequences.numSequences; i++) {
    if (app.project.sequences[i].sequenceID === sequenceId) {
      app.project.deleteSequence(app.project.sequences[i]);
      return _ok();
    }
  }
  return _err("Sequence not found: " + sequenceId);
}

function getSequenceSettings() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  return JSON.stringify({
    name: seq.name,
    id: seq.sequenceID,
    timebase: seq.timebase,
    frameSizeHorizontal: seq.frameSizeHorizontal,
    frameSizeVertical: seq.frameSizeVertical,
    audioChannelCount: seq.audioChannelCount,
    audioChannelType: seq.audioChannelType,
    audioDisplayFormat: seq.audioDisplayFormat,
    audioSampleRate: seq.audioSampleRate,
    videoDisplayFormat: seq.videoDisplayFormat,
    videoFieldType: seq.videoFieldType,
    end: seq.end.seconds,
  });
}

function setSequenceInOut(inPointSec, outPointSec) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  if (inPointSec >= 0) seq.setInPoint(inPointSec);
  if (outPointSec >= 0) seq.setOutPoint(outPointSec);
  return _ok();
}

function clearSequenceInOut() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  seq.setInPoint(seq.zeroPoint.seconds);
  seq.setOutPoint(seq.end.seconds);
  return _ok();
}

function nestClips(trackType, trackIndex, clipIndicesJson, nestedName) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  // Nest is done via selection and menu command - this is a QE operation
  return _ok({ note: "Use Premiere UI or execute_extendscript for nesting" });
}

function addTracks(videoCount, audioCount, position) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  for (var i = 0; i < videoCount; i++) {
    qeSeq.addVideoTrack();
  }
  for (var i = 0; i < audioCount; i++) {
    qeSeq.addAudioTrack();
  }
  return _ok({ videoTracksAdded: videoCount, audioTracksAdded: audioCount });
}

function removeTrack(trackType, trackIndex) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  if (trackType === "video") {
    qeSeq.removeVideoTrackAt(trackIndex);
  } else {
    qeSeq.removeAudioTrackAt(trackIndex);
  }
  return _ok();
}

function getTrackInfo(trackType, trackIndex) {
  var e = _requireSequence();
  if (e) return e;
  var track = _getTrack(trackType, trackIndex);
  if (!track) return _err("Track not found");
  var clips = [];
  for (var i = 0; i < track.clips.numItems; i++) {
    var clip = track.clips[i];
    clips.push({
      index: i,
      name: clip.name,
      start: clip.start.seconds,
      end: clip.end.seconds,
      duration: clip.duration.seconds,
    });
  }
  return JSON.stringify({
    name: track.name,
    index: trackIndex,
    type: trackType,
    muted: track.isMuted(),
    locked: track.isLocked(),
    numClips: track.clips.numItems,
    clips: clips,
  });
}

function setTrackMuted(trackType, trackIndex, muted) {
  var e = _requireSequence();
  if (e) return e;
  var track = _getTrack(trackType, trackIndex);
  if (!track) return _err("Track not found");
  track.setMute(muted ? 1 : 0);
  return _ok();
}

function setTrackLocked(trackType, trackIndex, locked) {
  var e = _requireSequence();
  if (e) return e;
  var track = _getTrack(trackType, trackIndex);
  if (!track) return _err("Track not found");
  track.setLocked(locked ? 1 : 0);
  return _ok();
}

function renameTrack(trackType, trackIndex, name) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  if (trackType === "video") {
    qeSeq.getVideoTrackAt(trackIndex).setName(name);
  } else {
    qeSeq.getAudioTrackAt(trackIndex).setName(name);
  }
  return _ok();
}

function autoReframeSequence(numerator, denominator, motionPreset, newName, useNested) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  var seqName = newName || (seq.name + " [" + numerator + "x" + denominator + "]");
  try {
    var newSeq = seq.autoReframeSequence(numerator, denominator, motionPreset, seqName, useNested);
    return _ok({ name: seqName, reframed: !!newSeq });
  } catch (ex) {
    return _err("Auto reframe failed: " + ex.toString());
  }
}

function sceneEditDetection(action, applyCutsToLinkedAudio, sensitivity) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  try {
    seq.performSceneEditDetectionOnSelection(action, applyCutsToLinkedAudio, sensitivity);
    return _ok({ action: action });
  } catch (ex) {
    return _err("Scene edit detection failed: " + ex.toString());
  }
}

function createSubsequence(ignoreTrackTargeting) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  var newSeq = seq.createSubsequence(ignoreTrackTargeting);
  return _ok({ name: newSeq ? newSeq.name : "" });
}

function setWorkArea(inPointSec, outPointSec) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  try {
    if (inPointSec >= 0) seq.setWorkAreaInPoint(inPointSec);
    if (outPointSec >= 0) seq.setWorkAreaOutPoint(outPointSec);
  } catch (ex) {
    return _err("Work area API not available in this version");
  }
  return _ok();
}

function getWorkArea() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  var result = {};
  try {
    result.inPoint = seq.getWorkAreaInPointAsTime().seconds;
    result.outPoint = seq.getWorkAreaOutPointAsTime().seconds;
    result.enabled = seq.isWorkAreaEnabled();
  } catch (ex) {
    result.note = "Work area API not available in this version";
  }
  return JSON.stringify(result);
}

function getSelection() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  var selected = [];

  for (var t = 0; t < seq.videoTracks.numTracks; t++) {
    for (var c = 0; c < seq.videoTracks[t].clips.numItems; c++) {
      var clip = seq.videoTracks[t].clips[c];
      try {
        if (clip.isSelected()) {
          selected.push({ trackType: "video", trackIndex: t, clipIndex: c, name: clip.name, start: clip.start.seconds, end: clip.end.seconds });
        }
      } catch (ex) {}
    }
  }
  for (var t = 0; t < seq.audioTracks.numTracks; t++) {
    for (var c = 0; c < seq.audioTracks[t].clips.numItems; c++) {
      var clip = seq.audioTracks[t].clips[c];
      try {
        if (clip.isSelected()) {
          selected.push({ trackType: "audio", trackIndex: t, clipIndex: c, name: clip.name, start: clip.start.seconds, end: clip.end.seconds });
        }
      } catch (ex) {}
    }
  }
  return JSON.stringify(selected);
}
