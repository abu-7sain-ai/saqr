/* Shared utilities for Premiere Pro MCP ExtendScript */

function _ok(data) {
  if (data === undefined) data = {};
  data.success = true;
  return JSON.stringify(data);
}

function _err(msg) {
  return JSON.stringify({ error: msg });
}

function _requireProject() {
  if (!app.project) return _err("No project open");
  return null;
}

function _requireSequence() {
  var e = _requireProject();
  if (e) return e;
  if (!app.project.activeSequence) return _err("No active sequence");
  return null;
}

function _getClip(trackType, trackIndex, clipIndex) {
  var seq = app.project.activeSequence;
  var tracks = trackType === "video" ? seq.videoTracks : seq.audioTracks;
  if (trackIndex >= tracks.numTracks) return null;
  var track = tracks[trackIndex];
  if (clipIndex >= track.clips.numItems) return null;
  return track.clips[clipIndex];
}

function _getTrack(trackType, trackIndex) {
  var seq = app.project.activeSequence;
  var tracks = trackType === "video" ? seq.videoTracks : seq.audioTracks;
  if (trackIndex >= tracks.numTracks) return null;
  return tracks[trackIndex];
}

function _findProjectItemByNodeId(root, nodeId) {
  for (var i = 0; i < root.children.numItems; i++) {
    var item = root.children[i];
    if (item.nodeId === nodeId) return item;
    if (item.type === ProjectItemType.BIN) {
      var found = _findProjectItemByNodeId(item, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function _findBinByPath(binPath) {
  var rootItem = app.project.rootItem;
  if (!binPath || binPath === "") return rootItem;

  var parts = binPath.split("/");
  var current = rootItem;
  for (var p = 0; p < parts.length; p++) {
    var found = false;
    for (var i = 0; i < current.children.numItems; i++) {
      if (current.children[i].name === parts[p] && current.children[i].type === ProjectItemType.BIN) {
        current = current.children[i];
        found = true;
        break;
      }
    }
    if (!found) return null;
  }
  return current;
}

function _makeTime(seconds) {
  var t = new Time();
  t.seconds = seconds;
  return t;
}

function _itemTypeName(item) {
  if (item.type === ProjectItemType.BIN) return "bin";
  if (item.type === ProjectItemType.CLIP) return "clip";
  if (item.type === ProjectItemType.FILE) return "file";
  return "unknown";
}

function _collectItems(root, recursive) {
  var items = [];
  for (var i = 0; i < root.children.numItems; i++) {
    var item = root.children[i];
    var info = {
      index: i,
      name: item.name,
      nodeId: item.nodeId,
      type: _itemTypeName(item),
    };
    if (item.type !== ProjectItemType.BIN) {
      try { info.mediaPath = item.getMediaPath(); } catch (e) {}
    }
    items.push(info);
    if (recursive && item.type === ProjectItemType.BIN) {
      var children = _collectItems(item, true);
      for (var c = 0; c < children.length; c++) {
        children[c].binPath = item.name + "/" + (children[c].binPath || "");
        items.push(children[c]);
      }
    }
  }
  return items;
}
