#!/usr/bin/env node

const Async = require('async');
const Url = require('url');
const opn = require('opn');
const ora = require('ora');

const program = require('commander');
program
    .option('-u, --url [url]', 'The endpoint of the deploy.sh server', 'http://localhost:5000')
    .parse(process.argv);

const name = program.args[0];
const { getDeployments, getCredentials } = require('../lib/helpers/cli')(program.url);

const spinner = ora(`Opening up url to deployment instance`).start();

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

    getDeployments({ token, username, name })
      .then((response) => callback(null, response))
      .catch((error) => callback(error, null));
  }
], (ex, result) => {
  if (ex) return spinner.fail(`API call failed 🙈 ${JSON.stringify({
    ex
  }, null, 4)}`);

  const { deployment } = result;

  const config = Url.parse(program.url);
  config.host = `${deployment.subdomain}.${config.host}`;
  const url = Url.format(config);

  spinner.text = `Opening deployment at ${url}`;
  spinner.stopAndPersist();
  opn(url, { wait: false });
});
