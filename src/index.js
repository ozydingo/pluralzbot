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
    const { ok } = await handleOauth(query);
    if (ok) {
      res.sendFile(__dirname + '/pages/oauth_success.html');
    } else {
      res.sendFile(__dirname + '/pages/oauth_failure.html');
    }
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
  const { text } = event;
  if (!eventInScope(event)) { return; }

  if (pluralz.hazPluralz(text)) {
    await handlePluralz(event);
  } else if (pluralz.hasPlural(text)) {
    await handlePlurals(event);
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
  if (action.block_id === 'set-prefs') {
    await setPrefs({ user, value, response_url });
  }
}

async function handleCommand({ user_id: userId, channel_id: channel }) {
  console.log("Handling command", { userId, channel });
  await axios(slackz.settingsInquiry({ userId, channel })).then(response => {
    users.touch(userId);
    logResponse(response, "suggestion");
  });
}

async function handleOauth({ code, state }) {
  console.log("Handling oauth", code ? "<CODE>" : undefined);
  const { data } = await axios(slackz.exchangeOauthCode(code));
  console.log("Oauth response: ", data);

  const { response_url } = JSON.parse(state);

  const { ok, authed_user: user = {} } = data;
  const { id: userId, scope, access_token: token, token_type } = user;
  let result;
  if (!ok) {
    result = {ok: false, message: `Something went wrong (${data.error || "unkown error"})`};
  } else if (!/chat:write:user/.test(scope)) {
    result = {ok: false, message: 'Sorry, you must grant me acess to post messagez for this to work!'};
  } else if (token_type !== 'user') {
    result = {ok: false, message: 'Hm, I got an incorrect token type. Try again.'};
  } else {
    await users.setToken(userId, token);
    result = {ok: true, message: "Good to go! From now on, I'll automatically correct your errorz. Type `/pluralz` if you change your mind."};
  }
  await axios(slackz.acknowledgeOauth({message: result.message, response_url}));
  return result;
}

async function handlePlurals(event) {
  const { ts, text, channel, user: userId } = event;
  const user = await users.find_or_create(userId);
  const userData = user.data();
  if (userData.participation === 'ignore') {
    console.log(`Pluralz: ignore user ${userId}.`)
  } else if (userData.participation === 'autocorrect' && userData.token) {
    console.log(`Pluralz: correct user ${userId}.`)
    return correctPluralz({ ts, text, channel, token: userData.token });
  } else if (!userData.participation || !userData.bugged_at || timeToBugAgain(userData.bugged_at.toDate())) {
    console.log(`Pluralz: time to bug user ${userId}! Last bug time: ${userData.bugged_at && userData.bugged_at.toDate()}`)
    return suggestPluralz({ userId, channel });
  } else {
    console.log(`Pluralz: we're hiding from user ${userId}.`)
  }
}

function handlePluralz(event) {
  const { ts, channel } = event;
  return axios(slackz.reactToPluralz( { ts, channel })).then(response => {
    logResponse(response, "reaction");
  });
}

function suggestPluralz({ userId, channel }) {
  return axios(slackz.suggestion({ userId, channel })).then(response => {
    users.touch(userId);
    logResponse(response, "suggestion");
  });
}

function correctPluralz({ ts, text, channel, token }) {
  return axios(slackz.correction({ ts, text, channel, token })).then(response => {
    logResponse(response, "correction");
  });
}

function setPrefs({ user, value, response_url }) {
  console.log(`Setting user ${user.id} to ${value}`);
  return Promise.all([
    users.setParticipation(user.id, value),
    axios(slackz.acknowledgePrefs({ value, response_url })).then(response => {
      logResponse(response, "user interaction");
    }),
  ]);
}
