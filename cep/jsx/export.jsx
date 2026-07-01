/* Export and render functions */

function exportSequence(outputPath, presetPath, startTimeSec, endTimeSec, useInOut) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  if (startTimeSec >= 0 && endTimeSec >= 0) {
    seq.setInPoint(startTimeSec);
    seq.setOutPoint(endTimeSec);
  }

  var workAreaType = app.encoder.ENCODE_ENTIRE;
  if (useInOut || (startTimeSec >= 0 && endTimeSec >= 0)) {
    workAreaType = app.encoder.ENCODE_IN_TO_OUT;
  }

  var jobId = app.encoder.encodeSequence(seq, outputPath, presetPath, workAreaType, true);
  app.encoder.startBatch();

  return _ok({ outputPath: outputPath, jobId: jobId });
}

function exportFrame(outputPath, timeSec, format) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  if (timeSec >= 0) {
    seq.setPlayerPosition(_makeTime(timeSec).ticks);
  }

  seq.exportFramePNG(timeSec >= 0 ? _makeTime(timeSec).ticks : seq.getPlayerPosition().ticks, outputPath);
  return _ok({ outputPath: outputPath });
}

function exportAAF(outputPath, mixdownAudio, explodeToMono, sampleRate, bitsPerSample) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  seq.exportAsMediaDirect(
    outputPath,
    "", // no preset
    app.encoder.ENCODE_ENTIRE
  );

  // AAF export via project
  app.project.exportAAF(
    seq,
    outputPath,
    mixdownAudio ? 1 : 0,
    explodeToMono ? 1 : 0,
    sampleRate,
    bitsPerSample,
    0, // embed audio
    0, // handle frames
    0  // render sequences
  );

  return _ok({ outputPath: outputPath });
}

function exportOMF(outputPath, sampleRate, bitsPerSample, handleDuration) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  app.project.exportOMF(
    seq,
    outputPath,
    "OMFTitle",
    sampleRate,
    bitsPerSample,
    1, // encapsulated
    handleDuration
  );

  return _ok({ outputPath: outputPath });
}

function exportEDL(outputPath, trackIndex) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  seq.exportAsEDL(outputPath, trackIndex);
  return _ok({ outputPath: outputPath });
}

function exportFinalCutXML(outputPath) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  seq.exportAsFinalCutProXML(outputPath);
  return _ok({ outputPath: outputPath });
}

function getEncoderPresets() {
  var presets = [];
  try {
    app.enableQE();
    var formatList = app.encoder.getFormatList();
    if (formatList) {
      for (var i = 0; i < formatList.length; i++) {
        presets.push({ format: formatList[i] });
      }
    }
  } catch (ex) {
    presets.push({ note: "Use File > Export > Media in Premiere Pro to see available presets, or provide an .epr preset path directly." });
  }
  return JSON.stringify(presets);
}

function renderSequencePreview(startTimeSec, endTimeSec) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  if (startTimeSec >= 0 && endTimeSec >= 0) {
    seq.setInPoint(startTimeSec);
    seq.setOutPoint(endTimeSec);
  }

  seq.renderSelection(true);
  return _ok();
}

function exportAsMediaDirect(outputPath, presetPath) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;
  seq.exportAsMediaDirect(outputPath, presetPath, app.encoder.ENCODE_ENTIRE);
  return _ok({ outputPath: outputPath });
}
