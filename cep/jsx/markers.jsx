/* Marker functions */

var _colorMap = {
  green: 0, red: 1, purple: 2, orange: 3,
  yellow: 4, white: 5, blue: 6, cyan: 7,
};

function addMarker(timeSec, name, comment, color, durationSec, markerType, url, frameTarget) {
  var e = _requireSequence();
  if (e) return e;

  var markers = app.project.activeSequence.markers;
  var marker = markers.createMarker(timeSec);

  if (name) marker.name = name;
  if (comment) marker.comments = comment;
  if (durationSec > 0) marker.end = _makeTime(durationSec);
  if (color && _colorMap[color] !== undefined) marker.setColorByIndex(_colorMap[color]);
  if (markerType === "chapter") marker.type = "Chapter";
  if (markerType === "webLink") {
    marker.type = "WebLink";
    if (url) marker.url = url;
    if (frameTarget) marker.frameTarget = frameTarget;
  }
  if (markerType === "segmentation") marker.type = "Segmentation";
  if (markerType === "flashCuePoint") marker.type = "FlashCuePoint";

  return _ok();
}

function getMarkers() {
  var e = _requireSequence();
  if (e) return e;

  var markers = app.project.activeSequence.markers;
  var result = [];
  var marker = markers.getFirstMarker();
  var idx = 0;
  while (marker) {
    result.push({
      index: idx++,
      name: marker.name,
      comments: marker.comments,
      start: marker.start.seconds,
      end: marker.end.seconds,
      type: marker.type,
      guid: marker.guid,
    });
    marker = markers.getNextMarker(marker);
  }
  return JSON.stringify(result);
}

function removeMarker(markerIndex) {
  var e = _requireSequence();
  if (e) return e;

  var markers = app.project.activeSequence.markers;
  var marker = markers.getFirstMarker();
  var idx = 0;
  while (marker) {
    if (idx === markerIndex) {
      markers.deleteMarker(marker);
      return _ok();
    }
    marker = markers.getNextMarker(marker);
    idx++;
  }
  return _err("Marker not found at index: " + markerIndex);
}

function updateMarker(markerIndex, name, comment, color, durationSec) {
  var e = _requireSequence();
  if (e) return e;

  var markers = app.project.activeSequence.markers;
  var marker = markers.getFirstMarker();
  var idx = 0;
  while (marker) {
    if (idx === markerIndex) {
      if (name !== null && name !== undefined) marker.name = name;
      if (comment !== null && comment !== undefined) marker.comments = comment;
      if (color !== null && color !== undefined && _colorMap[color] !== undefined) marker.setColorByIndex(_colorMap[color]);
      if (durationSec >= 0) marker.end = _makeTime(marker.start.seconds + durationSec);
      return _ok();
    }
    marker = markers.getNextMarker(marker);
    idx++;
  }
  return _err("Marker not found at index: " + markerIndex);
}

function clearAllMarkers() {
  var e = _requireSequence();
  if (e) return e;

  var markers = app.project.activeSequence.markers;
  var marker = markers.getFirstMarker();
  while (marker) {
    var next = markers.getNextMarker(marker);
    markers.deleteMarker(marker);
    marker = next;
  }
  return _ok();
}

function addClipMarker(trackType, trackIndex, clipIndex, timeSec, name, comment, color) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var markers = clip.markers;
  var marker = markers.createMarker(timeSec);
  if (name) marker.name = name;
  if (comment) marker.comments = comment;
  if (color && _colorMap[color] !== undefined) marker.setColorByIndex(_colorMap[color]);
  return _ok();
}

function getClipMarkers(trackType, trackIndex, clipIndex) {
  var e = _requireSequence();
  if (e) return e;
  var clip = _getClip(trackType, trackIndex, clipIndex);
  if (!clip) return _err("Clip not found");

  var markers = clip.markers;
  var result = [];
  var marker = markers.getFirstMarker();
  while (marker) {
    result.push({
      name: marker.name,
      comments: marker.comments,
      start: marker.start.seconds,
      end: marker.end.seconds,
      type: marker.type,
    });
    marker = markers.getNextMarker(marker);
  }
  return JSON.stringify(result);
}

function addProjectItemMarker(nodeId, timeSec, name, comment, color) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var markers = item.getMarkers();
  var marker = markers.createMarker(timeSec);
  if (name) marker.name = name;
  if (comment) marker.comments = comment;
  if (color && _colorMap[color] !== undefined) marker.setColorByIndex(_colorMap[color]);
  return _ok();
}
