#!/usr/bin/env node

const Async = require('async');
const opn = require('opn');
const ora = require('ora');
const program = require('commander');

program
  .parse(process.argv);

var project = program.args[0];

const { list, getCredentials } = require('../lib/helpers/cli');

const spinner = ora(`Starting deploy process`).start();

Async.waterfall([
  function(callback) {
    spinner.text = 'Getting deploy keys';

    getCredentials()
      .then((credentials) => callback(null, credentials))
      .catch((ex) => callback(ex, null));
  },
  function(credentials, callback) {
    spinner.text = 'Calling list API';

    const { token, username } = credentials;

    list({
      url: 'http://localhost:5000',
      token,
      username
    })
    .then((response) => callback(null, response))
    .catch((error) => {
      callback(error, null);
    });
  }
], (ex, result) => {
  if (ex) return spinner.fail('API call failed 🙈');

  const dep = result.deployments.filter((d) => d.project == project)[0];
  const url = `http://${dep.id}.localhost:5000`;

  spinner.text = `Opening deployment at ${url}`;
  spinner.stopAndPersist();
  opn(url);
});
