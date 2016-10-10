const vtkLoaders = require('../config/webpack.loaders.js');
const path = require('path');

module.exports = {
  baseUrl: '/pvw-presenter',
  work: './build-tmp',
  api: ['../src'],
  examples: ['../src'],
  config: {
    title: 'Rouse',
    description: '"Rouse the Web presentation maker that let you share your data."',
    subtitle: '"Command line tool for interactive presentation making"',
    author: 'Kitware Inc.',
    timezone: 'UTC',
    url: 'https://kitware.github.io/pvw-presenter',
    root: '/pvw-presenter/',
    github: 'kitware/pvw-presenter',
  },
  copy: [],
};
