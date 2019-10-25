const test_channel = process.env["TEST_CHANNEL"];

const axios = require('axios');
const pluralz = require('./pluralz');
const slackz = require('./slackz');
const users = require('./users');

// Respond to initial challenge when adding URL to the Slack app.
// This function is not needed thereafter.
exports.verify = (req, res) => {
  const body = req.body;
  if (body.challenge) {
    res.status(200).send(body.challenge);
  }
}

// Main event function handler
exports.main = async (req, res) => {
  const body = req.body;
  console.log(body);

  // event fields: { client_msg_id, user, ts, text, channel }
  const event = body.event || {};

  if (eventInScope(event)) {
    await handleMessage(event);
  }

  res.status(200).send('');
};

function eventInScope(event) {
  const { text, channel, type, subtype } = event;

  if (channel !== test_channel) { return false; }
  if (type !== "message" ) { return false; }
  if (subtype === "message_changed" ) { return false; }
  if (!text) { return false; }

  return true
}

async function handleMessage(event) {
  const { ts, text, channel, user: userId } = event;
  if (!pluralz.hasPlural(text)) { return; }

  const user = await users.find(userId);
  if (user && user.participation === 'ignore') {
    return;
  } else if (user.token) {
    correctPluralz({ ts, text, channel, token: user.token });
  } else {
    suggestPluralz({ userId, channel });
  }
}

function suggestPluralz({ userId, channel }) {
  axios(slackz.suggestion({ userId, channel })).then(response => {
    console.log("Response for suggestion:", response.data);
  });
}

function correctPluralz({ ts, text, channel, token }) {
  axios(slackz.correction({ ts, text, channel, token })).then(response => {
    console.log("Response for correction:", response.data);
  });
}
