var path = require('path');

function generateConfiguration(wwwDir, logsDir, port, hostname, cmds) {
  const config = {
    configuration: {
      host: hostname,
      port,
      endpoint: 'paraview',
      content: wwwDir,
      proxy_file: path.join(logsDir, 'proxy-mapping.txt'),
      sessionURL: 'ws://${host}:${port}/ws',
      timeout: 35,
      log_dir: logsDir,
      fields: [],
    },
    sessionData: {},
    properties: {},
    resources: [{ host: hostname, port_range: [port + 1, port + 20] }],
    apps: {},
  };

  Object.keys(cmds).forEach(function addCmd(name) {
    config.apps[name] = { cmd: cmds[name], ready_line: 'Starting factory' };
  });

  return config;
}

module.exports = generateConfiguration;
