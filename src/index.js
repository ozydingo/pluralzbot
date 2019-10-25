const BUG_TIME_THRESH = 1 * 60 * 1000;
const test_channel = process.env["TEST_CHANNEL"];

const axios = require('axios');
const pluralz = require('./pluralz');
const slackz = require('./slackz');
const users = require('./users');

// Main event function handler
exports.main = async (req, res) => {
  const body = req.body;
  console.log(body);

  // Allow re-verification of URL by Slack
  if (body.challenge) {
    res.status(200).send(body.challenge);
    return
  }

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

function timeToBugAgain(buggedAt) {
  return (new Date() - buggedAt) > BUG_TIME_THRESH;
}

async function handleMessage(event) {
  const { ts, text, channel, user: userId } = event;
  if (!pluralz.hasPlural(text)) { return; }

  const user = await users.find_or_create(userId);
  const userData = user.data();
  if (userData.participation === 'ignore') {
    console.log(`Action: ignore user ${userId}.`)
    return;
  } else if (userData.participation === 'autocorrect' && userData.token) {
    console.log(`Action: correct user ${userId}.`)
    correctPluralz({ ts, text, channel, token: userData.token });
  } else if (!user.participation || timeToBugAgain(userData.bugged_at)) {
    console.log(`Action: time to bug user ${userId}!`)
    suggestPluralz({ userId, channel });
  } else {
    console.log(`Action: we're hiding from user ${userId}.`)
    return;
  }
}

function suggestPluralz({ userId, channel }) {
  axios(slackz.suggestion({ userId, channel })).then(response => {
    users.touch(userId);
    console.log("Response for suggestion:", response.data);
  });
}

function correctPluralz({ ts, text, channel, token }) {
  axios(slackz.correction({ ts, text, channel, token })).then(response => {
    console.log("Response for correction:", response.data);
  });
}
