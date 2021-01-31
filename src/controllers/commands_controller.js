const axios = require('axios');
const { logError, logResponse } = require('../logging');
const slackz = require('../slackz');
const userz = require('../userz');
const { validateToken } = require('../verification');

async function respond(req, res) {
  const { body } = req;
  validateToken(body.token);

  res.status(200).write('');
  console.log(`Handling command '${body.command}' from user ${body.user_id} in channel ${body.channel_id}.`);
  await handleCommand(body);
  res.end();
}

async function handleCommand({ user_id: userId, channel_id: channel }) {
  await axios(slackz.settingsInquiry({ userId, channel })).then(response => {
    userz.touch(userId);
    logResponse(response, "suggestion");
  }).catch(err => {
    logError(err, "suggestion");
  });
}

module.exports = {
  respond
};
