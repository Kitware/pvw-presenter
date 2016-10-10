import React from 'react';
import ReactDOM from 'react-dom';

import { createClient } from 'paraviewweb/src/IO/WebSocket/ParaViewWebClient';
import SmartConnect from 'paraviewweb/src/IO/WebSocket/SmartConnect';
import VtkRenderer    from 'paraviewweb/src/React/Renderers/VtkRenderer';

import style from '../style.mcss';

function connect(container, config) {
  const smartConnect = new SmartConnect(config);
  smartConnect.onConnectionReady((connection) => {
    const client = createClient(connection, [
      'MouseHandler',
      'ViewPort',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(
      <VtkRenderer
        client={client}
        connection={connection}
        session={connection.session}
        className={style.viewport}
      />, container);
  });

  smartConnect.connect();
}


// ----------------------------------------------------------------------------

export const type = 'pvw-state';

export function free(viewport) {
  ReactDOM.unmountComponentAtNode(viewport);
}

export function init(viewport) {
  const state = viewport.getAttribute('data-root');
  connect(viewport, { state, application: 'state' });
}
