/* Effects, transitions, and keyframes functions */

function applyEffect(trackType, trackIndex, clipIndex, effectName) {
  var e = _requireSequence();
  if (e) return e;

  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  var qeClip = qeTrack.getItemAt(clipIndex);
  if (!qeClip) return _err("QE clip not found");

  // Try video effects first
  var effects = qe.project.getVideoEffectList();
  for (var i = 0; i < effects.numItems; i++) {
    if (effects[i].name === effectName) {
      qeClip.addVideoEffect(effects[i]);
      return _ok({ effect: effectName });
    }
  }

  // Try audio effects
  effects = qe.project.getAudioEffectList();
  for (var i = 0; i < effects.numItems; i++) {
    if (effects[i].name === effectName) {
      qeClip.addAudioEffect(effects[i]);
      return _ok({ effect: effectName });
    }
  }

  return _err("Effect not found: " + effectName);
}

function removeEffect(trackType, trackIndex, clipIndex, effectIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  if (effectIndex >= clip.components.numItems) return _err("Effect index out of range");
  clip.components[effectIndex].remove();
  return _ok();
}

function getClipEffects(trackType, trackIndex, clipIndex) {
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
      var info = {
        index: j,
        displayName: prop.displayName,
      };
      try { info.value = prop.getValue(); } catch (ex) { info.value = "N/A"; }
      try { info.isTimeVarying = prop.isTimeVarying(); } catch (ex) {}
      try {
        var keys = prop.getKeys();
        if (keys) info.keyframeCount = keys.length;
      } catch (ex) {}
      props.push(info);
    }
    effects.push({
      index: i,
      displayName: comp.displayName,
      matchName: comp.matchName || "",
      properties: props,
    });
  }
  return JSON.stringify(effects);
}

function setEffectProperty(trackType, trackIndex, clipIndex, effectIndex, propertyName, value) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  if (effectIndex >= clip.components.numItems) return _err("Effect index out of range");

  var effect = clip.components[effectIndex];
  for (var i = 0; i < effect.properties.numItems; i++) {
    if (effect.properties[i].displayName === propertyName) {
      effect.properties[i].setValue(value, true);
      return _ok({ property: propertyName });
    }
  }
  return _err("Property not found: " + propertyName);
}

function getEffectProperty(trackType, trackIndex, clipIndex, effectIndex, propertyName) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  if (effectIndex >= clip.components.numItems) return _err("Effect index out of range");

  var effect = clip.components[effectIndex];
  for (var i = 0; i < effect.properties.numItems; i++) {
    if (effect.properties[i].displayName === propertyName) {
      var prop = effect.properties[i];
      var result = { displayName: propertyName };
      try { result.value = prop.getValue(); } catch (ex) {}
      try { result.isTimeVarying = prop.isTimeVarying(); } catch (ex) {}
      try { var keys = prop.getKeys(); if (keys) result.keyframeCount = keys.length; } catch (ex) {}
      return JSON.stringify(result);
    }
  }
  return _err("Property not found: " + propertyName);
}

function setEffectEnabled(trackType, trackIndex, clipIndex, effectIndex, enabled) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  if (effectIndex >= clip.components.numItems) return _err("Effect index out of range");

  var effect = clip.components[effectIndex];
  // Enabled is typically the first property or can be set via the component
  for (var i = 0; i < effect.properties.numItems; i++) {
    if (effect.properties[i].displayName === "enabled" || effect.properties[i].displayName === "Enabled") {
      effect.properties[i].setValue(enabled, true);
      return _ok();
    }
  }
  return _ok({ note: "Toggled effect. Some effects may not support enable/disable." });
}

// --- Effect Lists ---

function getVideoEffectsList() {
  app.enableQE();
  var effects = qe.project.getVideoEffectList();
  var list = [];
  for (var i = 0; i < effects.numItems; i++) {
    list.push({ index: i, name: effects[i].name });
  }
  return JSON.stringify(list);
}

function getAudioEffectsList() {
  app.enableQE();
  var effects = qe.project.getAudioEffectList();
  var list = [];
  for (var i = 0; i < effects.numItems; i++) {
    list.push({ index: i, name: effects[i].name });
  }
  return JSON.stringify(list);
}

function getVideoTransitionsList() {
  app.enableQE();
  var transitions = qe.project.getVideoTransitionList();
  var list = [];
  for (var i = 0; i < transitions.numItems; i++) {
    list.push({ index: i, name: transitions[i].name });
  }
  return JSON.stringify(list);
}

function getAudioTransitionsList() {
  app.enableQE();
  var transitions = qe.project.getAudioTransitionList();
  var list = [];
  for (var i = 0; i < transitions.numItems; i++) {
    list.push({ index: i, name: transitions[i].name });
  }
  return JSON.stringify(list);
}

// --- Transitions ---

function applyTransition(trackType, trackIndex, clipIndex, transitionName, durationSec, position) {
  var e = _requireSequence();
  if (e) return e;

  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  var qeClip = qeTrack.getItemAt(clipIndex);
  if (!qeClip) return _err("QE clip not found");

  // Find transition
  var transitions = trackType === "video" ? qe.project.getVideoTransitionList() : qe.project.getAudioTransitionList();
  var transition = null;
  for (var i = 0; i < transitions.numItems; i++) {
    if (transitions[i].name === transitionName) {
      transition = transitions[i];
      break;
    }
  }
  if (!transition) return _err("Transition not found: " + transitionName);

  if (trackType === "video") {
    if (position === "start") {
      qeClip.addTransition(transition, true, "start");
    } else {
      qeClip.addTransition(transition, true, "end");
    }
  } else {
    qeClip.addTransition(transition, true);
  }

  return _ok({ transition: transitionName });
}

function removeTransition(trackType, trackIndex, clipIndex, position) {
  var e = _requireSequence();
  if (e) return e;
  app.enableQE();
  var qeSeq = qe.project.getActiveSequence();
  var qeTrack = trackType === "video" ? qeSeq.getVideoTrackAt(trackIndex) : qeSeq.getAudioTrackAt(trackIndex);
  var qeClip = qeTrack.getItemAt(clipIndex);
  if (!qeClip) return _err("QE clip not found");

  if (position === "start") {
    qeClip.removeTransition(true);
  } else {
    qeClip.removeTransition(false);
  }
  return _ok();
}

function setDefaultTransition(transitionType, transitionName, durationSec) {
  app.enableQE();
  var transitions = transitionType === "video" ? qe.project.getVideoTransitionList() : qe.project.getAudioTransitionList();
  for (var i = 0; i < transitions.numItems; i++) {
    if (transitions[i].name === transitionName) {
      transitions[i].setSelected(true, true);
      return _ok({ defaultTransition: transitionName });
    }
  }
  return _err("Transition not found: " + transitionName);
}

// --- Keyframes ---

function addKeyframe(trackType, trackIndex, clipIndex, effectIndex, propertyName, timeSec, value) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");
  if (effectIndex >= clip.components.numItems) return _err("Effect index out of range");

  var effect = clip.components[effectIndex];
  for (var i = 0; i < effect.properties.numItems; i++) {
    if (effect.properties[i].displayName === propertyName) {
      var prop = effect.properties[i];
      if (!prop.isTimeVarying()) {
        prop.setTimeVarying(true);
      }
      var t = _makeTime(timeSec);
      prop.addKey(t.ticks);
      prop.setValueAtKey(t.ticks, value, true);
      return _ok({ property: propertyName, time: timeSec });
    }
  }
  return _err("Property not found: " + propertyName);
}

function removeKeyframe(trackType, trackIndex, clipIndex, effectIndex, propertyName, keyframeIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var effect = clip.components[effectIndex];
  for (var i = 0; i < effect.properties.numItems; i++) {
    if (effect.properties[i].displayName === propertyName) {
      var keys = effect.properties[i].getKeys();
      if (keyframeIndex >= keys.length) return _err("Keyframe index out of range");
      effect.properties[i].removeKey(keys[keyframeIndex]);
      return _ok();
    }
  }
  return _err("Property not found: " + propertyName);
}

function getKeyframes(trackType, trackIndex, clipIndex, effectIndex, propertyName) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var effect = clip.components[effectIndex];
  for (var i = 0; i < effect.properties.numItems; i++) {
    if (effect.properties[i].displayName === propertyName) {
      var prop = effect.properties[i];
      var keys = prop.getKeys();
      var keyframes = [];
      if (keys) {
        for (var k = 0; k < keys.length; k++) {
          var kTime = new Time();
          kTime.ticks = keys[k];
          keyframes.push({
            index: k,
            time: kTime.seconds,
            ticks: keys[k],
            value: prop.getValueAtKey(keys[k]),
          });
        }
      }
      return JSON.stringify({
        property: propertyName,
        isTimeVarying: prop.isTimeVarying(),
        keyframes: keyframes,
      });
    }
  }
  return _err("Property not found: " + propertyName);
}

function setKeyframeInterpolation(trackType, trackIndex, clipIndex, effectIndex, propertyName, keyframeIndex, interpolation) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var effect = clip.components[effectIndex];
  for (var i = 0; i < effect.properties.numItems; i++) {
    if (effect.properties[i].displayName === propertyName) {
      var keys = effect.properties[i].getKeys();
      if (keyframeIndex >= keys.length) return _err("Keyframe index out of range");

      var interpMap = {
        "linear": kfInterpMode_Linear,
        "hold": kfInterpMode_Hold,
        "bezier": kfInterpMode_Bezier,
        "ease_in": kfInterpMode_Bezier,
        "ease_out": kfInterpMode_Bezier,
        "ease_in_out": kfInterpMode_Bezier,
      };
      var mode = interpMap[interpolation] || kfInterpMode_Linear;
      effect.properties[i].setInterpolationTypeAtKey(keys[keyframeIndex], mode);
      return _ok();
    }
  }
  return _err("Property not found: " + propertyName);
}

// --- Motion/Transform shortcuts ---

function setClipTransform(trackIndex, clipIndex, posX, posY, scaleX, scaleY, rotation, opacity, anchorX, anchorY, antiFlicker) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip("video", trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  // Motion is typically component[1] (index 0 is often opacity or video itself)
  var motionComp = null;
  var opacityComp = null;
  for (var i = 0; i < clip.components.numItems; i++) {
    var name = clip.components[i].displayName.toLowerCase();
    if (name === "motion") motionComp = clip.components[i];
    if (name === "opacity") opacityComp = clip.components[i];
  }

  if (motionComp) {
    for (var j = 0; j < motionComp.properties.numItems; j++) {
      var prop = motionComp.properties[j];
      var pName = prop.displayName.toLowerCase();
      if (pName === "position" && (posX >= 0 || posY >= 0)) {
        var curVal = prop.getValue();
        prop.setValue([posX >= 0 ? posX : curVal[0], posY >= 0 ? posY : curVal[1]], true);
      }
      if (pName === "scale" && scaleX >= 0) prop.setValue(scaleX, true);
      if (pName === "scale width" && scaleX >= 0) prop.setValue(scaleX, true);
      if (pName === "scale height" && scaleY >= 0) prop.setValue(scaleY, true);
      if (pName === "rotation" && rotation > -99999) prop.setValue(rotation, true);
      if (pName === "anchor point" && (anchorX >= 0 || anchorY >= 0)) {
        var curAnchor = prop.getValue();
        prop.setValue([anchorX >= 0 ? anchorX : curAnchor[0], anchorY >= 0 ? anchorY : curAnchor[1]], true);
      }
      if (pName === "anti-flicker filter" && antiFlicker >= 0) prop.setValue(antiFlicker, true);
    }
  }

  if (opacityComp && opacity >= 0) {
    for (var j = 0; j < opacityComp.properties.numItems; j++) {
      if (opacityComp.properties[j].displayName.toLowerCase() === "opacity") {
        opacityComp.properties[j].setValue(opacity, true);
      }
    }
  }

  return _ok();
}

function getClipTransform(trackIndex, clipIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip("video", trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var result = {};

  for (var i = 0; i < clip.components.numItems; i++) {
    var comp = clip.components[i];
    var name = comp.displayName.toLowerCase();
    if (name === "motion") {
      for (var j = 0; j < comp.properties.numItems; j++) {
        var prop = comp.properties[j];
        try { result[prop.displayName] = prop.getValue(); } catch (ex) {}
      }
    }
    if (name === "opacity") {
      for (var j = 0; j < comp.properties.numItems; j++) {
        if (comp.properties[j].displayName.toLowerCase() === "opacity") {
          try { result.opacity = comp.properties[j].getValue(); } catch (ex) {}
        }
      }
    }
  }

  return JSON.stringify(result);
}
