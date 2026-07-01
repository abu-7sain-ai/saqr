/* Graphics, MOGRTs, and generators */

function importMogrt(mogrtPath) {
  var e = _requireProject();
  if (e) return e;
  app.project.importFiles([mogrtPath], false, app.project.rootItem, false);
  return _ok({ mogrtPath: mogrtPath });
}

function addMogrtToTimeline(mogrtPath, trackIndex, startTimeSec, durationSec) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  try {
    var result = seq.importMGT(
      mogrtPath,
      _makeTime(startTimeSec).ticks,
      trackIndex,
      trackIndex  // video track
    );
    return _ok({ mogrt: mogrtPath });
  } catch (ex) {
    return _err("Failed to add MOGRT: " + ex.toString());
  }
}

function getMogrtProperties(trackIndex, clipIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip("video", trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var props = [];
  try {
    var mgt = clip.getMGTComponent();
    if (mgt) {
      for (var i = 0; i < mgt.properties.numItems; i++) {
        var prop = mgt.properties[i];
        props.push({
          index: i,
          displayName: prop.displayName,
          value: prop.getValue(),
        });
      }
    }
  } catch (ex) {
    // Fallback: list all components
    for (var i = 0; i < clip.components.numItems; i++) {
      var comp = clip.components[i];
      for (var j = 0; j < comp.properties.numItems; j++) {
        props.push({
          componentIndex: i,
          componentName: comp.displayName,
          propertyIndex: j,
          displayName: comp.properties[j].displayName,
          value: comp.properties[j].getValue(),
        });
      }
    }
  }
  return JSON.stringify(props);
}

function setMogrtProperty(trackIndex, clipIndex, propertyName, value) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip("video", trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  try {
    var mgt = clip.getMGTComponent();
    if (mgt) {
      for (var i = 0; i < mgt.properties.numItems; i++) {
        if (mgt.properties[i].displayName === propertyName) {
          mgt.properties[i].setValue(value, true);
          return _ok({ property: propertyName });
        }
      }
    }
  } catch (ex) {}

  // Fallback: search all components
  for (var i = 0; i < clip.components.numItems; i++) {
    for (var j = 0; j < clip.components[i].properties.numItems; j++) {
      if (clip.components[i].properties[j].displayName === propertyName) {
        clip.components[i].properties[j].setValue(value, true);
        return _ok({ property: propertyName });
      }
    }
  }
  return _err("Property not found: " + propertyName);
}

function addTextGraphic(text, trackIndex, startTimeSec, durationSec, fontSize, fontFamily, color, posX, posY, alignment) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  // Text graphics are added via Essential Graphics - use MOGRT or QE
  try {
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    // Add a title/text graphic
    qeSeq.addTitle(text, _makeTime(startTimeSec).ticks, trackIndex);
    return _ok({ text: text, note: "Text graphic added. Edit properties via Essential Graphics panel or set_mogrt_property." });
  } catch (ex) {
    return _err("Failed to add text graphic. Use add_mogrt_to_timeline with a text MOGRT template instead. Error: " + ex.toString());
  }
}

function addColorMatte(trackIndex, startTimeSec, durationSec, color, name) {
  var e = _requireSequence();
  if (e) return e;

  try {
    app.enableQE();
    // Parse hex color
    var r = parseInt(color.substr(1, 2), 16);
    var g = parseInt(color.substr(3, 2), 16);
    var b = parseInt(color.substr(5, 2), 16);

    var seq = app.project.activeSequence;
    qe.project.newColorMatte(
      seq.frameSizeHorizontal,
      seq.frameSizeVertical,
      r, g, b,
      name
    );
    return _ok({ name: name, color: color, note: "Color matte created in project panel. Use add_clip_to_timeline to place it." });
  } catch (ex) {
    return _err("Failed to create color matte: " + ex.toString());
  }
}

function addBarsAndTone(trackIndex, startTimeSec, durationSec) {
  var e = _requireSequence();
  if (e) return e;

  try {
    app.enableQE();
    var seq = app.project.activeSequence;
    qe.project.newBarsAndTone(seq.frameSizeHorizontal, seq.frameSizeVertical);
    return _ok({ note: "Bars and tone created in project panel. Use add_clip_to_timeline to place it." });
  } catch (ex) {
    return _err("Failed to create bars and tone: " + ex.toString());
  }
}

function addBlackVideo(trackIndex, startTimeSec, durationSec) {
  var e = _requireSequence();
  if (e) return e;

  try {
    app.enableQE();
    var seq = app.project.activeSequence;
    qe.project.newBlackVideo(seq.frameSizeHorizontal, seq.frameSizeVertical);
    return _ok({ note: "Black video created in project panel. Use add_clip_to_timeline to place it." });
  } catch (ex) {
    return _err("Failed to create black video: " + ex.toString());
  }
}

function addUniversalCountingLeader(trackIndex, startTimeSec) {
  var e = _requireSequence();
  if (e) return e;

  try {
    app.enableQE();
    var seq = app.project.activeSequence;
    qe.project.newUniversalCountingLeader(seq.frameSizeHorizontal, seq.frameSizeVertical);
    return _ok({ note: "Universal counting leader created in project panel. Use add_clip_to_timeline to place it." });
  } catch (ex) {
    return _err("Failed to create counting leader: " + ex.toString());
  }
}

/* ─── TikTok-style caption tools ─── */

var _MOGRT_DIR = "C:/Program Files/Adobe/Adobe Premiere Pro 2026/Essential Graphics/";
var _MOGRT_TEMPLATES = {
  "basic":      _MOGRT_DIR + "Basic Title.mogrt",
  "bold":       _MOGRT_DIR + "Titles/Bold Title.mogrt",
  "classic":    _MOGRT_DIR + "Titles/Classic Title.mogrt",
  "modern":     _MOGRT_DIR + "Titles/Modern Title.mogrt",
  "film":       _MOGRT_DIR + "Titles/Film Title.mogrt",
  "lower_third": _MOGRT_DIR + "Basic Lower Third.mogrt"
};

function _setTextProps(clip, text, posX, posY, scale) {
  var comps = clip.components;
  for (var c = 0; c < comps.numItems; c++) {
    var comp = comps[c];
    if (comp.displayName === "Text") {
      for (var p = 0; p < comp.properties.numItems; p++) {
        var prop = comp.properties[p];
        if (prop.displayName === "Source Text" && text !== undefined && text !== null) {
          prop.setValue(text, true);
        }
        if (prop.displayName === "Position" && posX !== undefined && posY !== undefined) {
          prop.setValue([posX, posY], true);
        }
        if (prop.displayName === "Scale" && scale !== undefined && scale !== null) {
          prop.setValue(scale, true);
        }
      }
    }
    if (comp.displayName === "Motion") {
      for (var p2 = 0; p2 < comp.properties.numItems; p2++) {
        if (comp.properties[p2].displayName === "Scale" && scale !== undefined && scale !== null) {
          comp.properties[p2].setValue(scale, true);
        }
      }
    }
  }
}

function addTikTokCaption(text, trackIndex, startTimeSec, durationSec, posX, posY, scale, template) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  var mogrtPath = _MOGRT_TEMPLATES[template || "bold"] || _MOGRT_TEMPLATES["bold"];

  try {
    var startTicks = _makeTime(startTimeSec).ticks;
    seq.importMGT(mogrtPath, startTicks, trackIndex, trackIndex);

    // Find the newly added clip (last on the track)
    var track = seq.videoTracks[trackIndex];
    var clip = track.clips[track.clips.numItems - 1];

    // Set text content and position
    _setTextProps(clip, text, posX || 0.5, posY || 0.5, scale || 100);

    // Set duration by adjusting the out point
    if (durationSec) {
      var endTicks = _makeTime(startTimeSec + durationSec).ticks;
      clip.end = endTicks;
    }

    return _ok({
      text: text,
      trackIndex: trackIndex,
      clipIndex: track.clips.numItems - 1,
      start: startTimeSec,
      duration: durationSec,
      template: template || "bold"
    });
  } catch (ex) {
    return _err("Failed to add caption: " + ex.toString());
  }
}

function addCaptionSequence(captionsJSON, trackIndex, template, posX, posY, scale) {
  var e = _requireSequence();
  if (e) return e;
  var seq = app.project.activeSequence;

  var captions;
  if (typeof captionsJSON === "string") {
    captions = JSON.parse(captionsJSON);
  } else {
    captions = captionsJSON;
  }

  var mogrtPath = _MOGRT_TEMPLATES[template || "bold"] || _MOGRT_TEMPLATES["bold"];
  var results = [];

  for (var i = 0; i < captions.length; i++) {
    var cap = captions[i];
    try {
      var startTicks = _makeTime(cap.start).ticks;
      seq.importMGT(mogrtPath, startTicks, trackIndex, trackIndex);

      var track = seq.videoTracks[trackIndex];
      var clip = track.clips[track.clips.numItems - 1];

      _setTextProps(clip, cap.text, posX || 0.5, posY || 0.75, scale || 100);

      if (cap.duration) {
        clip.end = _makeTime(cap.start + cap.duration).ticks;
      }

      results.push({text: cap.text, start: cap.start, duration: cap.duration});
    } catch (ex) {
      results.push({text: cap.text, error: ex.toString()});
    }
  }

  return _ok({captions: results, count: results.length});
}

function styleTextGraphic(trackIndex, clipIndex, text, posX, posY, scale, opacity) {
  var e = _requireSequence();
  if (e) return e;

  var clip = _getClip("video", trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  try {
    _setTextProps(clip, text, posX, posY, scale);

    if (opacity !== undefined && opacity !== null) {
      var comps = clip.components;
      for (var c = 0; c < comps.numItems; c++) {
        if (comps[c].displayName === "Opacity") {
          for (var p = 0; p < comps[c].properties.numItems; p++) {
            if (comps[c].properties[p].displayName === "Opacity") {
              comps[c].properties[p].setValue(opacity, true);
            }
          }
        }
      }
    }

    return _ok({trackIndex: trackIndex, clipIndex: clipIndex});
  } catch (ex) {
    return _err("Failed to style text: " + ex.toString());
  }
}

function getAvailableMogrts() {
  var templates = [];
  for (var key in _MOGRT_TEMPLATES) {
    templates.push({name: key, path: _MOGRT_TEMPLATES[key]});
  }
  return JSON.stringify(templates);
}
