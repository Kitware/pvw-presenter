import ReactDOM from 'react-dom';
import { load, updateConfig } from 'arctic-viewer/lib/arctic-viewer';

export const type = 'pvw-arctic-viewer';

export function free(viewport) {
  ReactDOM.unmountComponentAtNode(viewport);
}

export function init(viewport) {
  const configArg = viewport.getAttribute('data-config');
  updateConfig({});
  if (configArg) {
    try {
      updateConfig(JSON.parse(configArg));
    } catch (err) {
      console.log('parse error?', configArg, err);
    }
  }

  load(`${viewport.getAttribute('data-root')}/index.json`, viewport);
}
