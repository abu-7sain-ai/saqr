/* Project management functions */

function getProjectInfo() {
  var e = _requireProject();
  if (e) return e;
  var proj = app.project;
  return JSON.stringify({
    name: proj.name,
    path: proj.path,
    numSequences: proj.sequences.numSequences,
    numItems: proj.rootItem.children.numItems,
    documentID: proj.documentID,
  });
}

function saveProject() {
  var e = _requireProject();
  if (e) return e;
  app.project.save();
  return _ok();
}

function saveProjectAs(path) {
  var e = _requireProject();
  if (e) return e;
  app.project.saveAs(path);
  return _ok({ path: path });
}

function openProject(path) {
  app.openDocument(path);
  return _ok({ path: path });
}

function closeProject(save) {
  var e = _requireProject();
  if (e) return e;
  if (save) app.project.save();
  app.project.closeDocument();
  return _ok();
}

function importMedia(filePathsJson, targetBinPath, asNumberedStills) {
  var e = _requireProject();
  if (e) return e;
  var filePaths = JSON.parse(filePathsJson);

  if (targetBinPath && targetBinPath !== "") {
    var bin = _findBinByPath(targetBinPath);
    if (!bin) return _err("Target bin not found: " + targetBinPath);
    var success = app.project.importFiles(filePaths, false, bin, asNumberedStills || false);
  } else {
    var success = app.project.importFiles(filePaths, false, app.project.rootItem, asNumberedStills || false);
  }
  return _ok({ filesCount: filePaths.length, imported: success });
}

function importSequences(projectPath, sequenceIdsJson) {
  var e = _requireProject();
  if (e) return e;
  var result = app.project.importSequences(projectPath);
  return _ok({ imported: result });
}

function getProjectItems(binPath, recursive) {
  var e = _requireProject();
  if (e) return e;

  var root = _findBinByPath(binPath);
  if (!root) return _err("Bin not found: " + binPath);

  return JSON.stringify(_collectItems(root, recursive));
}

function getProjectItemInfo(nodeId) {
  var e = _requireProject();
  if (e) return e;

  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var info = {
    name: item.name,
    nodeId: item.nodeId,
    type: _itemTypeName(item),
    treePath: item.treePath,
  };

  if (item.type !== ProjectItemType.BIN) {
    try { info.mediaPath = item.getMediaPath(); } catch (ex) {}
    try {
      var footageInterpretation = item.getFootageInterpretation();
      if (footageInterpretation) {
        info.frameRate = footageInterpretation.frameRate;
        info.pixelAspectRatio = footageInterpretation.pixelAspectRatio;
        info.fieldType = footageInterpretation.fieldType;
        info.removePulldown = footageInterpretation.removePulldown;
        info.alphaUsage = footageInterpretation.alphaUsage;
      }
    } catch (ex) {}
    try {
      var inPoint = item.getInPoint();
      var outPoint = item.getOutPoint();
      if (inPoint) info.inPoint = inPoint.seconds;
      if (outPoint) info.outPoint = outPoint.seconds;
    } catch (ex) {}
    try { info.isOffline = item.isOffline(); } catch (ex) {}
    try {
      var proxyPath = item.getProxyPath();
      if (proxyPath) info.proxyPath = proxyPath;
    } catch (ex) {}
  }
  return JSON.stringify(info);
}

function createBin(name, parentBinPath) {
  var e = _requireProject();
  if (e) return e;

  var parent = _findBinByPath(parentBinPath);
  if (!parent) return _err("Parent bin not found: " + parentBinPath);

  var newBin = parent.createBin(name);
  return _ok({ name: name, nodeId: newBin ? newBin.nodeId : "" });
}

function renameProjectItem(nodeId, newName) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  item.name = newName;
  return _ok({ name: newName });
}

function deleteProjectItems(nodeIdsJson) {
  var e = _requireProject();
  if (e) return e;
  var nodeIds = JSON.parse(nodeIdsJson);
  var deleted = 0;
  for (var i = 0; i < nodeIds.length; i++) {
    var item = _findProjectItemByNodeId(app.project.rootItem, nodeIds[i]);
    if (item) {
      app.project.deleteAsset(item);
      deleted++;
    }
  }
  return _ok({ deleted: deleted });
}

function moveProjectItem(nodeId, targetBinPath) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  var bin = _findBinByPath(targetBinPath);
  if (!bin) return _err("Target bin not found: " + targetBinPath);
  item.moveBin(bin);
  return _ok();
}

function setProjectItemInOut(nodeId, inPoint, outPoint) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  item.setInPoint(inPoint, 4);
  item.setOutPoint(outPoint, 4);
  return _ok();
}

function clearProjectItemInOut(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  item.clearInPoint();
  item.clearOutPoint();
  return _ok();
}

function createProxy(nodeId, presetPath) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  var result = item.createProxy(presetPath);
  return _ok({ result: result });
}

function attachProxy(nodeId, proxyPath) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  var result = item.attachProxy(proxyPath, 0);
  return _ok({ result: result });
}

function toggleProxyMode(enable) {
  var e = _requireProject();
  if (e) return e;
  app.project.setEnableProxies(enable ? 1 : 0);
  return _ok({ proxiesEnabled: enable });
}

function refreshMedia(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  item.refreshMedia();
  return _ok();
}

function findProjectItems(query, type) {
  var e = _requireProject();
  if (e) return e;
  var results = [];
  _searchItems(app.project.rootItem, query, type, results, "");
  return JSON.stringify(results);
}

function _searchItems(root, query, type, results, path) {
  for (var i = 0; i < root.children.numItems; i++) {
    var item = root.children[i];
    var itemType = _itemTypeName(item);
    var matchesType = (type === "all") || (type === itemType);
    if (matchesType && item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
      results.push({ name: item.name, nodeId: item.nodeId, type: itemType, path: path + item.name });
    }
    if (item.type === ProjectItemType.BIN) {
      _searchItems(item, query, type, results, path + item.name + "/");
    }
  }
}

function setProjectSettings(scratchDiskPath, gpuRenderer) {
  var e = _requireProject();
  if (e) return e;
  if (scratchDiskPath && scratchDiskPath !== "") {
    app.project.setScratchDiskPath(scratchDiskPath, ScratchDiskType.FirstVideoCaptureFolder);
    app.project.setScratchDiskPath(scratchDiskPath, ScratchDiskType.FirstAudioCaptureFolder);
    app.project.setScratchDiskPath(scratchDiskPath, ScratchDiskType.FirstVideoPreviewFolder);
    app.project.setScratchDiskPath(scratchDiskPath, ScratchDiskType.FirstAudioPreviewFolder);
  }
  if (gpuRenderer && gpuRenderer !== "") {
    app.project.setGPURenderingPolicy(gpuRenderer);
  }
  return _ok();
}

function createSubClip(nodeId, name, inPointSec, outPointSec, hardBoundaries) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var inTime = _makeTime(inPointSec);
  var outTime = _makeTime(outPointSec);
  var subClip = item.createSubClip(name, inTime.ticks, outTime.ticks, hardBoundaries ? 1 : 0, 1, 1);
  return _ok({ name: name, nodeId: subClip ? subClip.nodeId : "" });
}

function relinkMedia(nodeId, newPath) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  if (!item.canChangeMediaPath()) return _err("Cannot relink this item");
  item.changeMediaPath(newPath, true);
  return _ok({ newPath: newPath });
}

function importAEComps(aepPath, compNamesJson, targetBinPath) {
  var e = _requireProject();
  if (e) return e;
  var compNames = JSON.parse(compNamesJson);
  var targetBin = targetBinPath ? _findBinByPath(targetBinPath) : app.project.rootItem;

  if (compNames.length > 0) {
    app.project.importAEComps(aepPath, compNames, targetBin);
  } else {
    app.project.importAllAEComps(aepPath, targetBin);
  }
  return _ok({ aepPath: aepPath });
}

function consolidateDuplicates() {
  var e = _requireProject();
  if (e) return e;
  app.project.consolidateDuplicates();
  return _ok();
}

function getProjectItemTypeInfo(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var info = { name: item.name, nodeId: nodeId, type: _itemTypeName(item) };
  try { info.isSequence = item.isSequence(); } catch (ex) {}
  try { info.isAdjustmentLayer = item.isAdjustmentLayer(); } catch (ex) {}
  try { info.isMergedClip = item.isMergedClip(); } catch (ex) {}
  try { info.isMulticamClip = item.isMulticamClip(); } catch (ex) {}
  try { info.isOffline = item.isOffline(); } catch (ex) {}
  return JSON.stringify(info);
}

function setScaleToFrameSize(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  item.setScaleToFrameSize();
  return _ok();
}

function flushCache() {
  app.enableQE();
  try { qe.project.flushCache(); } catch (ex) {}
  return _ok();
}
