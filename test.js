#!/usr/bin/env node

const fs = require('fs'),
  path = require('path'),
  posthtml = require('posthtml'),
  minify = require('./');

const test = posthtml([minify()]);

try {
  fs.mkdirSync(path.join(__dirname, 'test', 'output'));
} catch (e) {
  // already exists
}

fs.readdirSync(path.join(__dirname, 'test', 'input')).forEach(file => {
  const inFile = path.join(__dirname, 'test', 'input', file),
  outFile = path.join(__dirname, 'test', 'output', file);

  fs.writeFileSync(
    outFile,
    test.process(fs.readFileSync(inFile, 'utf-8'), {sync: true}).html
  );
});
