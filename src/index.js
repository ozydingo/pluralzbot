const bug_timeout = Number(process.env.BUG_TIMEOUT || 1);
const BUG_TIMEOUT_MILLIS = bug_timeout * 60 * 1000;
const test_channel = process.env["TEST_CHANNEL"];

const axios = require('axios');
const pluralz = require('./pluralz');
const slackz = require('./slackz');
const users = require('./users');

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

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
  } else if (query.action === 'oauth') {
    const { ok, message } = await handleOauth(query);
    res.status(ok ? 200 : 500).send(message);
  } else {
    res.status(404).send('No action to perform.');
  }
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
  console.log("Handling event", event);
  const { ts, text, channel, user: userId } = event;
  if (!eventInScope(event)) { return; }
  if (!pluralz.hasPlural(text)) { return; }

  const user = await users.find_or_create(userId);
  const userData = user.data();
  if (userData.participation === 'ignore') {
    console.log(`Pluralz: ignore user ${userId}.`)
  } else if (userData.participation === 'autocorrect' && userData.token) {
    console.log(`Pluralz: correct user ${userId}.`)
    await correctPluralz({ ts, text, channel, token: userData.token });
  } else if (!userData.participation || !userData.bugged_at || timeToBugAgain(userData.bugged_at.toDate())) {
    console.log(`Pluralz: time to bug user ${userId}! Last bug time: ${userData.bugged_at && userData.bugged_at.toDate()}`)
    await suggestPluralz({ userId, channel });
  } else {
    console.log(`Pluralz: we're hiding from user ${userId}.`)
  }
}

async function handleResponse(payloadStr) {
  console.log("Handling response", payloadStr);
  const payload = JSON.parse(payloadStr);
  if (payload.type !== "block_actions") { return; }

  const { user, response_url, actions } = payload;
  const action = actions[0] || {};
  const value = action.value;
  if (!user || !user.id) { return; }

  console.log(`Setting user ${user.id} to ${value}`);

  await Promise.all([
    users.setParticipation(user.id, value),
    axios(slackz.acknowledgePrefs({ value, response_url })).then(response => {
      logResponse(response, "user interaction");
    }),
  ]);
}

async function handleCommand({ user_id: userId, channel_id: channel }) {
  console.log("Handling command", { userId, channel });
  await axios(slackz.settingsInquiry({ userId, channel })).then(response => {
    users.touch(userId);
    logResponse(response, "suggestion");
  });
}

async function handleOauth({ code }) {
  console.log("Handling oauth", code ? "<CODE>" : undefined);
  const { data } = await axios(slackz.exchangeOauthCode(code));
  console.log("Oauth response: ", data);

  const { ok, authed_user: user = {} } = data;
  const { id: userId, scope, access_token: token, token_type } = user;
  if (!ok) {
    return {ok: false, message: data.error || 'Something went wrong.'};
  } else if (!/chat:write:user/.test(scope)) {
    return {ok: false, message: 'You must grant acess to post messagez for this to work!'};
  } else if (token_type !== 'user') {
    return {ok: false, message: 'Incorrect token type'};
  } else {
    await users.setToken(userId, token);
    return {ok: true, message: "Good to go!"};
  }
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
