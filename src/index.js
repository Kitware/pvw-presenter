/* eslint-disable */
import * as arcticViewer from './ArcticViewer';
import * as sceneLoader from './SceneLoader';
import * as stateLoader from './StateLoader';

const WAIT_TIME = 1000;
const processQueue = [];
const handlerTypeMap = {};
let timeoutId = null;

[arcticViewer, sceneLoader, stateLoader].forEach(handler => {
  handlerTypeMap[handler.type] = handler;
});

function freeResources(slide) {
  if (!slide) {
    return;
  }

  const viewports = slide.querySelectorAll('.pvw-viewport');
  for (let i = 0; i < viewports.length; i++) {
    const viewport = viewports[i];
    const handler = handlerTypeMap[viewport.getAttribute('data-type')];
    if (handler) {
      handler.free(viewport);
    }
  }
}

function initResources() {
  let slideToProcess = null;

  // Keep only the last one
  while (processQueue.length) {
    slideToProcess = processQueue.shift();
  }

  if (slideToProcess) {
    const viewports = slideToProcess.querySelectorAll('.pvw-viewport');
    for (let i = 0; i < viewports.length; i++) {
      const viewport = viewports[i];
      const handler = handlerTypeMap[viewport.getAttribute('data-type')];
      if (handler) {
        handler.init(viewport);
      }
    }
  }
}

export function onSlideChange(previousSlide, nextSlide) {
  // Always try to free resources
  freeResources(previousSlide);

  // Push new slide for later processing
  processQueue.push(nextSlide);

  // Skip pending processing slides
  if (timeoutId) {
    window.clearTimeout(timeoutId);
    timeoutId = null;
  }

  timeoutId = window.setTimeout(initResources, WAIT_TIME);
}
