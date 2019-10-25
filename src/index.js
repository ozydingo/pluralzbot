const bug_timeout = Number(process.env.BUG_TIMEOUT || 1);
const BUG_TIMEOUT_MILLIS = bug_timeout * 60 * 1000;
const CLIENT_ID = process.env.CLIENT_ID;
const test_channel = process.env["TEST_CHANNEL"];

const axios = require('axios');
const pluralz = require('./pluralz');
const slackz = require('./slackz');
const users = require('./users');

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log(body);
  console.log(query);

  // Allow re-verification of URL by Slack
  if (body.challenge) {
    res.status(200).send(body.challenge);
  } else if (query.action === 'event' && body.event) {
    await handleEvent(body.event);
    res.status(200).send('');
  } else if (query.action === 'response' && body.payload) {
    await handleResponse(body.payload);
    res.status(200).send('');
  } else if (query.action === 'command') {
    res.status(200).send('');
    await handleCommand(body);
  }

  res.status(404).send('No action to perform.');
};

function eventInScope(event) {
  return (
    event.channel === test_channel &&
    event.type === "message" && !event.subtype
  );
}

function logResponse(response, name="request") {
  console.log(`Response for ${name}:`, response.data);
}

function timeToBugAgain(buggedAt) {
  return (new Date() - buggedAt) > BUG_TIMEOUT_MILLIS;
}

async function handleEvent(event) {
  const { ts, text, channel, user: userId } = event;
  if (!eventInScope(event)) { return; }
  if (!pluralz.hasPlural(text)) { return; }

  const user = await users.find_or_create(userId);
  const userData = user.data();
  if (userData.participation === 'ignore') {
    console.log(`Pluralz: ignore user ${userId}.`)
    return;
  } else if (userData.participation === 'autocorrect' && userData.token) {
    console.log(`Pluralz: correct user ${userId}.`)
    correctPluralz({ ts, text, channel, token: userData.token });
  } else if (!userData.participation || !userData.bugged_at || timeToBugAgain(userData.bugged_at.toDate())) {
    console.log(`Pluralz: time to bug user ${userId}! Last bug time: ${userData.bugged_at && userData.bugged_at.toDate()}`)
    suggestPluralz({ userId, channel });
  } else {
    console.log(`Pluralz: we're hiding from user ${userId}.`)
    return;
  }
}

async function handleResponse(payloadStr) {
  const payload = JSON.parse(payloadStr);
  if (payload.type !== "block_actions") { return; }

  const { user, response_url, actions } = payload;
  const action = actions[0] || {};
  const value = action.value;
  if (!user || !user.id) { return; }

  console.log(`Setting user ${user.id} to ${value}`);

  users.setParticipation(user.id, value);
  axios(slackz.acknowledgePrefs({ value, response_url })).then(response => {
    logResponse(response, "user interaction");
  })
}

async function handleCommand({ user_id: userId, channel_id: channel }) {
  axios(slackz.settingsInquiry({ userId, channel })).then(response => {
    users.touch(userId);
    logResponse(response, "suggestion");
  });
}

function suggestPluralz({ userId, channel }) {
  axios(slackz.suggestion({ userId, channel })).then(response => {
    users.touch(userId);
    logResponse(response, "suggestion");
  });
}

function correctPluralz({ ts, text, channel, token }) {
  axios(slackz.correction({ ts, text, channel, token })).then(response => {
    logResponse(response, "correction");
  });
}
