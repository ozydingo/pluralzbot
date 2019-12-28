const axios = require('axios');
const { logError, logResponse } = require('../logging');
const slackz = require('../slackz');
const userz = require('../userz');

async function respond(req, res) {
  const { body } = req;
  res.status(200).write('');
  await handleCommand(body);
  res.end();
}

async function handleCommand({ user_id: userId, channel_id: channel }) {
  console.log("Handling command", { userId, channel });
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
