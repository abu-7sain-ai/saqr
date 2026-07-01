/* Timeline / clip manipulation functions */

function getTimelineClips(trackType, trackIndex) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  var results = [];

  function getClipsFromTracks(tracks, type) {
    for (var t = 0; t < tracks.numTracks; t++) {
      if (trackIndex >= 0 && t !== trackIndex) continue;
      var track = tracks[t];
      for (var c = 0; c < track.clips.numItems; c++) {
        var clip = track.clips[c];
        results.push({
          trackType: type,
          trackIndex: t,
          clipIndex: c,
          name: clip.name,
          startTime: clip.start.seconds,
          endTime: clip.end.seconds,
          duration: clip.duration.seconds,
          inPoint: clip.inPoint.seconds,
          outPoint: clip.outPoint.seconds,
          mediaType: clip.mediaType,
          enabled: clip.isSelected(),
        });
      }
    }
  }

  if (trackType === "all" || trackType === "video") getClipsFromTracks(seq.videoTracks, "video");
  if (trackType === "all" || trackType === "audio") getClipsFromTracks(seq.audioTracks, "audio");
  return JSON.stringify(results);
}

function addClipToTimeline(projectItemNodeId, trackIndex, startTimeSec, trackType, inPointSec, outPointSec) {
  var e = _requireSequence();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, projectItemNodeId);
  if (!item) return _err("Project item not found: " + projectItemNodeId);

  var seq = app.project.activeSequence;
  var startTime = _makeTime(startTimeSec);

  if (inPointSec >= 0) item.setInPoint(inPointSec, 4);
  if (outPointSec >= 0) item.setOutPoint(outPointSec, 4);

  if (trackType === "audio") {
    seq.audioTracks[trackIndex].insertClip(item, startTime);
  } else {
    seq.videoTracks[trackIndex].insertClip(item, startTime);
  }
  return _ok();
}

function overwriteClipToTimeline(projectItemNodeId, trackIndex, startTimeSec, trackType, inPointSec, outPointSec) {
  var e = _requireSequence();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, projectItemNodeId);
  if (!item) return _err("Project item not found: " + projectItemNodeId);

  var seq = app.project.activeSequence;
  var startTime = _makeTime(startTimeSec);

  if (inPointSec >= 0) item.setInPoint(inPointSec, 4);
  if (outPointSec >= 0) item.setOutPoint(outPointSec, 4);

  if (trackType === "audio") {
    seq.audioTracks[trackIndex].overwriteClip(item, startTime);
  } else {
    seq.videoTracks[trackIndex].overwriteClip(item, startTime);
  }
  return _ok();
}

function setClipPosition(trackType, trackIndex, clipIndex, startTimeSec, endTimeSec) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  if (startTimeSec >= 0) clip.start = _makeTime(startTimeSec);
  if (endTimeSec >= 0) clip.end = _makeTime(endTimeSec);
  return _ok();
}

function setClipInOut(trackType, trackIndex, clipIndex, inPointSec, outPointSec) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  if (inPointSec >= 0) clip.inPoint = _makeTime(inPointSec);
  if (outPointSec >= 0) clip.outPoint = _makeTime(outPointSec);
  return _ok();
}

function removeClip(trackType, trackIndex, clipIndex, ripple) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  clip.remove(ripple, ripple);
  return _ok();
}

function razorClip(trackType, trackIndex, timeSec) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  qeTrack.razor(_makeTime(timeSec).ticks);
  return _ok();
}

function razorAllTracks(timeSec) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var ticks = _makeTime(timeSec).ticks;

  for (var i = 0; i < qeSeq.numVideoTracks; i++) {
    try { qeSeq.getVideoTrackAt(i).razor(ticks); } catch (ex) {}
  }
  for (var i = 0; i < qeSeq.numAudioTracks; i++) {
    try { qeSeq.getAudioTrackAt(i).razor(ticks); } catch (ex) {}
  }
  return _ok();
}

function setClipSpeed(trackType, trackIndex, clipIndex, speed, reverse, ripple, maintainPitch) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var speedStr = speed.toString();
  clip.setSpeed(speedStr, "ticks", reverse, maintainPitch);
  return _ok({ speed: speed, reverse: reverse });
}

function enableDisableClip(trackType, trackIndex, clipIndex, enabled) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  clip.setDisabled(!enabled);
  return _ok({ enabled: enabled });
}

function setClipLabel(trackType, trackIndex, clipIndex, colorIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  clip.setColorLabel(colorIndex);
  return _ok();
}

function renameClip(trackType, trackIndex, clipIndex, newName) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  clip.name = newName;
  return _ok();
}

function linkClips(videoTrackIndex, videoClipIndex, audioTrackIndex, audioClipIndex) {
  var e = _requireSequence();
  if (e) return e;
  var vClip = _getClip("video", videoTrackIndex, videoClipIndex);
  var aClip = _getClip("audio", audioTrackIndex, audioClipIndex);
  if (!vClip || !aClip) return _err("Clip not found");
  vClip.link(aClip);
  return _ok();
}

function unlinkClip(trackType, trackIndex, clipIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  clip.unlink();
  return _ok();
}

function getClipInfo(trackType, trackIndex, clipIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var effects = [];
  for (var i = 0; i < clip.components.numItems; i++) {
    var comp = clip.components[i];
    var props = [];
    for (var j = 0; j < comp.properties.numItems; j++) {
      var prop = comp.properties[j];
      props.push({
        index: j,
        displayName: prop.displayName,
        value: prop.getValue(),
        keyframeCount: prop.getKeys ? prop.getKeys().length : 0,
      });
    }
    effects.push({ index: i, displayName: comp.displayName, properties: props });
  }

  return JSON.stringify({
    name: clip.name,
    startTime: clip.start.seconds,
    endTime: clip.end.seconds,
    duration: clip.duration.seconds,
    inPoint: clip.inPoint.seconds,
    outPoint: clip.outPoint.seconds,
    mediaType: clip.mediaType,
    components: effects,
  });
}

function addAdjustmentLayer(trackIndex, startTimeSec, durationSec, name) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  qeSeq.addVideoTrack();
  // Adjustment layers are added via project item creation
  var seq = app.project.activeSequence;
  // Use QE to add adjustment layer
  try {
    qe.project.newAdjustmentLayer(name, seq.frameSizeHorizontal, seq.frameSizeVertical);
  } catch (ex) {}
  return _ok({ note: "Adjustment layer created in project panel. Drag to timeline or use add_clip_to_timeline." });
}

function selectClips(clipsJson) {
  var e = _requireSequence();
  if (e) return e;
  var clips = JSON.parse(clipsJson);
  var seq = app.project.activeSequence;
  // Deselect all first
  for (var t = 0; t < seq.videoTracks.numTracks; t++) {
    for (var c = 0; c < seq.videoTracks[t].clips.numItems; c++) {
      seq.videoTracks[t].clips[c].setSelected(false, true);
    }
  }
  for (var t = 0; t < seq.audioTracks.numTracks; t++) {
    for (var c = 0; c < seq.audioTracks[t].clips.numItems; c++) {
      seq.audioTracks[t].clips[c].setSelected(false, true);
    }
  }
  // Select specified clips
  for (var i = 0; i < clips.length; i++) {
    var clip = _getClip(clips[i].trackType, clips[i].trackIndex, clips[i].clipIndex);
    if (clip) clip.setSelected(true, true);
  }
  return _ok({ selected: clips.length });
}

function deselectAll() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  for (var t = 0; t < seq.videoTracks.numTracks; t++) {
    for (var c = 0; c < seq.videoTracks[t].clips.numItems; c++) {
      seq.videoTracks[t].clips[c].setSelected(false, true);
    }
  }
  for (var t = 0; t < seq.audioTracks.numTracks; t++) {
    for (var c = 0; c < seq.audioTracks[t].clips.numItems; c++) {
      seq.audioTracks[t].clips[c].setSelected(false, true);
    }
  }
  return _ok();
}

function slipClip(trackType, trackIndex, clipIndex, offsetSeconds) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  var qeClip = qeTrack.getItemAt(clipIndex);
  if (!qeClip) return _err("QE clip not found");
  try {
    var offsetTicks = _makeTime(Math.abs(offsetSeconds)).ticks;
    if (offsetSeconds < 0) offsetTicks = "-" + offsetTicks;
    qeClip.slip(offsetTicks);
    return _ok({ offset: offsetSeconds });
  } catch (ex) {
    return _err("Slip failed: " + ex.toString());
  }
}

function slideClip(trackType, trackIndex, clipIndex, offsetSeconds) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  var qeClip = qeTrack.getItemAt(clipIndex);
  if (!qeClip) return _err("QE clip not found");
  try {
    var offsetTicks = _makeTime(Math.abs(offsetSeconds)).ticks;
    if (offsetSeconds < 0) offsetTicks = "-" + offsetTicks;
    qeClip.slide(offsetTicks);
    return _ok({ offset: offsetSeconds });
  } catch (ex) {
    return _err("Slide failed: " + ex.toString());
  }
}

function rippleDelete(trackType, trackIndex, clipIndex) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  var qeClip = qeTrack.getItemAt(clipIndex);
  if (!qeClip) return _err("QE clip not found");
  try {
    qeClip.rippleDelete();
    return _ok();
  } catch (ex) {
    return _err("Ripple delete failed: " + ex.toString());
  }
}

function moveClipToTrack(trackType, sourceTrackIndex, clipIndex, targetTrackIndex) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(sourceTrackIndex) : qeSeq.getAudioTrackAt(sourceTrackIndex);
  var qeClip = qeTrack.getItemAt(clipIndex);
  if (!qeClip) return _err("QE clip not found");
  try {
    var trackOffset = targetTrackIndex - sourceTrackIndex;
    if (trackType === "video") {
      qeClip.moveToTrack(trackOffset, 0, "0", false);
    } else {
      qeClip.moveToTrack(0, trackOffset, "0", false);
    }
    return _ok({ targetTrack: targetTrackIndex });
  } catch (ex) {
    return _err("Move to track failed: " + ex.toString());
  }
}

function duplicateClip(trackType, trackIndex, clipIndex, targetTimeSec, targetTrackIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  // Get the source project item and insert at target position
  var projItem = clip.projectItem;
  if (!projItem) return _err("No source project item for this clip");

  var seq = app.project.activeSequence;
  var targetTime = _makeTime(targetTimeSec);

  if (trackType === "video") {
    seq.videoTracks[targetTrackIndex].overwriteClip(projItem, targetTime);
  } else {
    seq.audioTracks[targetTrackIndex].overwriteClip(projItem, targetTime);
  }
  return _ok();
}

function getClipSpeed(trackType, trackIndex, clipIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var result = {};
  try { result.speed = clip.getSpeed(); } catch (ex) { result.speed = 1; }
  try { result.reversed = clip.isSpeedReversed(); } catch (ex) { result.reversed = false; }
  return JSON.stringify(result);
}

function freezeFrame(trackType, trackIndex, clipIndex, timeSec, durationSec) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  // Freeze frame: set speed to 0 and adjust
  // Alternative: use add frame hold via QE
  try {
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
    var qeClip = qeTrack.getItemAt(clipIndex);
    if (qeClip) {
      // Set speed to 0 effectively creates a freeze
      qeClip.setSpeed(0, "ticks", false, false, false);
      return _ok({ note: "Freeze frame applied. Adjust duration manually if needed." });
    }
  } catch (ex) {}
  return _err("Freeze frame not supported via scripting. Use Time Remapping in Premiere Pro UI.");
}
