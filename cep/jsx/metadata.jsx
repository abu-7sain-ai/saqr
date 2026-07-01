/* Metadata and XMP functions */

function getClipMetadata(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var metadata = {};
  try {
    var xmp = item.getProjectMetadata();
    metadata.projectMetadata = xmp;
  } catch (ex) {}

  try {
    var columns = app.project.getProjectPanelMetadata();
    metadata.projectPanelMetadata = columns;
  } catch (ex) {}

  return JSON.stringify(metadata);
}

function setClipMetadata(nodeId, property, value) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  item.setProjectMetadata(value, [property]);
  return _ok({ property: property });
}

function getXMPMetadata(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var xmp = item.getXMPMetadata();
  return JSON.stringify({ xmp: xmp });
}

function setXMPMetadata(nodeId, xmpXml) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  item.setXMPMetadata(xmpXml);
  return _ok();
}

function getFileMetadata(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var info = { name: item.name, nodeId: nodeId };

  try { info.mediaPath = item.getMediaPath(); } catch (ex) {}
  try {
    var interp = item.getFootageInterpretation();
    if (interp) {
      info.frameRate = interp.frameRate;
      info.pixelAspectRatio = interp.pixelAspectRatio;
      info.fieldType = interp.fieldType;
      info.alphaUsage = interp.alphaUsage;
      info.audioChannelType = interp.audioChannelType;
    }
  } catch (ex) {}
  try { info.isOffline = item.isOffline(); } catch (ex) {}
  try {
    // Get source clip duration
    var inP = item.getInPoint();
    var outP = item.getOutPoint();
    if (inP) info.inPoint = inP.seconds;
    if (outP) info.outPoint = outP.seconds;
  } catch (ex) {}

  return JSON.stringify(info);
}

function setClipDescription(nodeId, description) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  // Use the project metadata schema
  var schema = "http://ns.adobe.com/premierePrivateProjectMetaData/1.0/";
  item.setProjectMetadata(description, [schema + "Column.PropertyText.Description"]);
  return _ok();
}

function setProjectItemLabel(nodeId, colorIndex) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);
  item.setColorLabel(colorIndex);
  return _ok();
}

function getClipColorSpace(nodeId) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var info = {};
  try {
    info.colorSpace = item.getColorSpace();
  } catch (ex) {
    info.note = "Color space info not available for this item.";
  }
  return JSON.stringify(info);
}

function setOverrideFrameRate(nodeId, frameRate) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var interp = item.getFootageInterpretation();
  if (!interp) return _err("Cannot get footage interpretation");
  interp.frameRate = frameRate;
  item.setFootageInterpretation(interp);
  return _ok({ frameRate: frameRate });
}

function setOverridePixelAspectRatio(nodeId, numerator, denominator) {
  var e = _requireProject();
  if (e) return e;
  var item = _findProjectItemByNodeId(app.project.rootItem, nodeId);
  if (!item) return _err("Item not found: " + nodeId);

  var interp = item.getFootageInterpretation();
  if (!interp) return _err("Cannot get footage interpretation");
  interp.pixelAspectRatio = numerator / denominator;
  item.setFootageInterpretation(interp);
  return _ok({ pixelAspectRatio: numerator / denominator });
}
