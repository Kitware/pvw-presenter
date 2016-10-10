#! /usr/bin/env node

/* eslint-disable */

var fs = require('fs');
var program = require('commander');
var path = require('path');
var shell = require('shelljs');
var srcPresenter = path.join(__dirname, '../dist');
var srcRevealjs = path.join(__dirname, '../node_modules/reveal.js');
var workDir = path.join(process.env.HOME, '.config', 'pvw-presenter');
var createConfig = require('./default-launcher-config.js');
var pkg = require('../package.json');
var version = /semantically-release/.test(pkg.version) ? 'development version' : pkg.version;
var paraview = process.env.PARAVIEW_HOME;
var webServer = require('./webServer.js');
var cmds = {};


// Argument processing
program
  .version(version)
  .option('-h, --host [localhost]', 'Hostname to use for client to connect', 'localhost')
  .option('-p, --port [3000]', 'Start web server with given port', Number, 3000)
  .option('-d, --slides [directory]', 'Directory that contains the slides')
  .option('-s, --server-only', 'Do not open the web browser\n')

  .option('--paraview [path]', 'Provide the ParaView root path to use\n')

  .option('--demo', 'Use the demo slide deck\n')

  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(1);
}

console.log(' => Building your presentation...');

// Figure out slides path
var slidesRoot = (program.demo || !program.slides) ? path.join(__dirname, '../demo') : program.slides;
var slidesPath = path.join(slidesRoot, '../demo/slides.html');

// Find out ParaView location
if(!paraview) {
    paraview = [];
    [ program.paraview, '/Applications/paraview.app/Contents', '/opt/paraview'].forEach(function(directory){
        try {
            if(fs.statSync(directory).isDirectory()) {
                paraview.push(directory);
            }
        } catch(err) {
            // skip
        }
    });
}

// Build command lines
var pvPythonExecs = shell.find(paraview).filter(function(file) { return file.match(/pvpython$/) || file.match(/pvpython.exe$/); });
var launcherPy = shell.find(paraview).filter(function(file) { return file.match(/launcher.py$/); });
if(pvPythonExecs.length < 1) {
    console.log('Could not find pvpython in your ParaView HOME directory ($PARAVIEW_HOME)');
    program.outputHelp();
    process.exit(1);
} else {
  cmds.state = [
    pvPythonExecs[0], '-dr',
    path.normalize(path.join(__dirname, '../server/pvw-state-loader.py')),
    '--state', '${state}',
    '--port', '${port}',
    '--host', '${host}',
  ];
}

// Create directories
['www', 'config', 'logs'].forEach(function(dirToCreate) {
  shell.mkdir('-p', path.join(workDir, dirToCreate));
});

// Copy Reveal.js
['css', 'lib', 'plugin', 'js'].forEach(function(name) {
  shell.cp('-rf', path.join(srcRevealjs, name), path.join(workDir, 'www'));
});

// Copy presenter
shell.ls(srcPresenter).forEach(function (name) {
  shell.cp('-rf', path.join(srcPresenter, name), path.join(workDir, 'www'));
});

// Copy three.js
shell.cp('-f', path.join(srcPresenter, '../node_modules/arctic-viewer/dist/three.js'), path.join(workDir, 'www'));

// Copy slides assets
// shell.cp('-rf', path.join(slidesRoot, 'assets'), path.join(workDir, 'www'));

// Configure launcher
const launcherConfigFile = path.join(workDir, 'config', 'launcher.json');
const config = createConfig(path.join(workDir, 'www'), path.join(workDir, 'logs'), program.port + 1, program.host, cmds)
shell.ShellString(JSON.stringify(config)).to(launcherConfigFile);

// Patch slides
shell.sed('-i', 'YOUR_SLIDES_GO_HERE', shell.cat(slidesPath), path.join(workDir, 'www', 'index.html'));
shell.sed('-i', 'data-root="data/', `data-root="${path.join(slidesRoot, 'data')}/`, path.join(workDir, 'www', 'index.html'));

// Start launcher
var child = shell.exec([
    pvPythonExecs[0],
    launcherPy[0],
    launcherConfigFile,
  ].join(' '), { async:true });

webServer(
  path.join(workDir, 'www'),
  program.port,
  path.join(slidesRoot, 'assets'),
  program.serverOnly
);

// Open browser
// if (!program.serverOnly) {
//   setTimeout(function() {
//     require('open')('http://localhost:' + program.port);
//   }, 500);
// }
