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

  const event = body.event || {};
  const route = eventRoute(event);

  // Allow re-verification of URL by Slack
  if (body.challenge) {
    res.status(200).send(body.challenge);
    return;
  } else if (!eventInScope(event)) {
    // no-op
  } else if (route === 'message') {
    await handleMessage(event);
  } else if (route === 'response') {
    await handleResponse(event);
  }

  res.status(200).send('');
};

function eventRoute(event) {
  const { type, subtype, payload } = event;
  if (type === "message" && !subtype) {
    return "message";
  } else if (payload && payload.type === "block actions") {
    return "response";
  } else {
    return null;
  }
}

function eventInScope(event) {
  return event.channel === test_channel;
}

function logResponse(response, name="request") {
  console.log(`Response for ${name}:`, response.data);
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

async function handleResponse(event) {
  const payload = event.payload || {};
  const { user, response_url, actions } = payload;
  const action = actions[0] || {};
  const value = action.value;
  if (!user || !user.id) { return; }

  users.setParticipation(user.id, value);
  axios(slackz.acknowledgePrefs({ value, response_url })).then(response => {
    logResponse(response, "user interaction");
  })
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
