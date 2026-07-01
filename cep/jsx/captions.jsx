/* Captions and subtitles functions */

function getCaptionTracks() {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  var tracks = [];
  try {
    for (var i = 0; i < seq.captionTracks.numTracks; i++) {
      var track = seq.captionTracks[i];
      tracks.push({
        index: i,
        name: track.name,
        numCaptions: track.clips ? track.clips.numItems : 0,
      });
    }
  } catch (ex) {
    return JSON.stringify({ note: "Caption tracks API not available in this Premiere Pro version.", tracks: [] });
  }
  return JSON.stringify(tracks);
}

function addCaptionTrack(format) {
  var e = _requireSequence();
  if (e) return e;
  // Caption track creation varies by version
  try {
    app.project.activeSequence.createCaptionTrack("", format);
  } catch (ex) {
    return _err("Failed to create caption track: " + ex.toString());
  }
  return _ok();
}

function addCaption(trackIndex, startTimeSec, endTimeSec, text) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  try {
    var captionTrack = seq.captionTracks[trackIndex];
    if (!captionTrack) return _err("Caption track not found at index: " + trackIndex);
    captionTrack.addCaption(startTimeSec, endTimeSec, text);
  } catch (ex) {
    return _err("Failed to add caption: " + ex.toString());
  }
  return _ok();
}

function getCaptions(trackIndex) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  var captions = [];
  try {
    var captionTrack = seq.captionTracks[trackIndex];
    if (!captionTrack) return _err("Caption track not found at index: " + trackIndex);

    if (captionTrack.clips) {
      for (var i = 0; i < captionTrack.clips.numItems; i++) {
        var clip = captionTrack.clips[i];
        captions.push({
          index: i,
          text: clip.name || "",
          startTime: clip.start.seconds,
          endTime: clip.end.seconds,
        });
      }
    }
  } catch (ex) {
    return _err("Failed to get captions: " + ex.toString());
  }
  return JSON.stringify(captions);
}

function updateCaption(trackIndex, captionIndex, text, startTimeSec, endTimeSec) {
  var e = _requireSequence();
  if (e) return e;
  try {
    var captionTrack = app.project.activeSequence.captionTracks[trackIndex];
    if (!captionTrack) return _err("Caption track not found");
    var clip = captionTrack.clips[captionIndex];
    if (!clip) return _err("Caption not found at index: " + captionIndex);

    if (text !== null && text !== undefined) clip.name = text;
    if (startTimeSec >= 0) clip.start = _makeTime(startTimeSec);
    if (endTimeSec >= 0) clip.end = _makeTime(endTimeSec);
  } catch (ex) {
    return _err("Failed to update caption: " + ex.toString());
  }
  return _ok();
}

function removeCaption(trackIndex, captionIndex) {
  var e = _requireSequence();
  if (e) return e;
  try {
    var captionTrack = app.project.activeSequence.captionTracks[trackIndex];
    if (!captionTrack) return _err("Caption track not found");
    var clip = captionTrack.clips[captionIndex];
    if (!clip) return _err("Caption not found");
    clip.remove(false, false);
  } catch (ex) {
    return _err("Failed to remove caption: " + ex.toString());
  }
  return _ok();
}

function importCaptions(filePath) {
  var e = _requireSequence();
  if (e) return e;
  try {
    app.project.activeSequence.importCaptionFile(filePath);
  } catch (ex) {
    // Fallback: try importing as regular media
    app.project.importFiles([filePath], false, app.project.rootItem, false);
  }
  return _ok({ filePath: filePath });
}

function exportCaptions(outputPath, format, trackIndex) {
  var e = _requireSequence();
  if (e) return e;
  try {
    app.project.activeSequence.exportCaptionFile(outputPath);
  } catch (ex) {
    return _err("Failed to export captions: " + ex.toString());
  }
  return _ok({ outputPath: outputPath });
}

function transcribeSequence() {
  var e = _requireSequence();
  if (e) return e;
  try {
    app.project.activeSequence.transcribe();
    return _ok({ note: "Transcription started. Check Premiere Pro for progress." });
  } catch (ex) {
    return _err("Transcription not available: " + ex.toString());
  }
}
