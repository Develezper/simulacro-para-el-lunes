import { bindApiBaseControls } from './config.js';
import { setActiveNavigation } from './ui.js';

function initializeShell(pageId) {
  setActiveNavigation(pageId);
  bindApiBaseControls();
}

export { initializeShell };
