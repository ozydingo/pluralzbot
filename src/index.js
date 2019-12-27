const bug_timeout = Number(process.env.BUG_TIMEOUT || 1);
const BUG_TIMEOUT_MILLIS = bug_timeout * 60 * 1000;
// const VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN;

const axios = require('axios');
const pluralz = require('./pluralz');
const slackz = require('./slackz');
const userz = require('./userz');

// Main event function handler
exports.main = async (req, res) => {
  if (process.env.SHUTOFF) {
    console.log("SHUTOFF");
    res.status(200).send('');
    return;
  }

  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  // TODO: not all POSTS have the token. Figure this out.
  // if (body.token !== VERIFICATION_TOKEN) {
  //   res.status(501).send('Unauthorised request.');
  //   return;
  // }

  // Allow re-verification of URL by Slack
  if (body.challenge) {
    res.status(200).send(body.challenge);
  } else if (query.action === 'event' && body.event) {
    res.status(200).write('');
    await handleEvent(body.event);
    res.end();
  } else if (query.action === 'response' && body.payload) {
    res.status(200).write('');
    await handleResponse(body.payload);
    res.end();
  } else if (query.action === 'command') {
    res.status(200).write('');
    await handleCommand(body);
    res.end();
  } else if (query.action === 'oauth') {
    const { ok } = await handleOauthRedirect(query);
    if (ok) {
      res.status(200).sendFile(__dirname + '/pages/oauth_success.html');
    } else {
      res.status(200).sendFile(__dirname + '/pages/oauth_failure.html');
    }
  } else {
    res.status(404).send('No action to perform.');
  }
};

function logResponse(response, name="request") {
  console.log(`Response for ${name}:`, response.data);
}

function logError(error, name="requeust") {
  console.log(`[ERROR] Response for ${name}:`, error);
}

function timeToBugAgain(buggedAt) {
  return (new Date() - buggedAt) > BUG_TIMEOUT_MILLIS;
}

async function handleEvent(event) {
  console.log("Handling event", event);
  const { text } = event;

  if (event.type === 'app_mention') {
    return reactToMessage(event, "bananadance");
  } else if (event.type === "message" && !event.subtype) {
    const actions = [];
    if (pluralz.hasPlural(text)) {
      actions.push(handlePlurals(event))
    }
    if (pluralz.hazPluralz(text)) {
      actions.push(handlePluralz(event));
    }
    return Promise.all(actions);
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
  } else if (action.block_id === 'oauth-access') {
    await handleOauthRequest({ user, value, response_url });
  } else if (user.name) {
    await setUsername(user);
  }
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

async function handleOauthRedirect({ code, state }) {
  console.log("Handling oauth", code ? "<CODE>" : undefined);
  const { data } = await axios(slackz.exchangeOauthCode(code));
  console.log("Oauth response: ", data);

  const { response_url, channel, user_id } = JSON.parse(state);

  const { ok, authed_user: user = {} } = data;
  const { id: userId, scope, access_token: token, token_type } = user;
  let result;
  if (!ok) {
    result = {ok: false, message: `Something went wrong (${data.error || "unkown error"})`};
  } else if (!/chat:write/.test(scope)) {
    result = {ok: false, message: 'Sorry, you must grant me acess to post messagez for this to work!'};
  } else if (token_type !== 'user') {
    result = {ok: false, message: 'Hm, I got an incorrect token type. Please try again.'};
  } else {
    await userz.setToken(userId, token, {name: user.name});
    result = {ok: true, message: "Good to go! From now on, I'll automatically correct your errorz. Type `/pluralz` if you change your mind."};
  }
  console.log("Oauth result:", result)
  await axios(slackz.acknowledgeOauth({
    ok,
    message: result.message,
    state: { response_url, channel, user_id }
  })).then(response => {
    logResponse(response, "oauth ack");
  }).catch(err => {
    logError(err, "oauth ack");
  });
  return result;
}

async function handlePlurals(event) {
  const { ts, text, channel, user: userId } = event;
  const user = await userz.find_or_create(userId);
  const userData = user.data();
  const lastEventId = userData.lastEventId;
  const requests = [];

  if (event.client_msg_id === lastEventId) {
    console.log(`Pluralz: ignore dup event ${lastEventId}`);
    return;
  } else if (event.client_msg_id) {
    requests.push(userz.setLastEventId(user, event.client_msg_id));
  }

  if (userData.participation === 'ignore') {
    console.log(`Pluralz: ignore user ${userId}.`)
  } else if (userData.participation === 'autocorrect' && userData.token) {
    console.log(`Pluralz: correct user ${userId}.`)
    requests.push(correctPluralz({ userId, ts, text, channel, token: userData.token }));
  } else if (userData.participation === 'autocorrect' && !userData.token) {
    console.log(`Pluralz: requesting token for user ${userId}.`)
    requests.push(reauth({ userId, channel }));
  } else if (!userData.participation || !userData.bugged_at || timeToBugAgain(userData.bugged_at.toDate())) {
    console.log(`Pluralz: time to bug user ${userId}! Last bug time: ${userData.bugged_at && userData.bugged_at.toDate()}`)
    requests.push(suggestPluralz({ userId, channel }));
  } else {
    console.log(`Pluralz: we're hiding from user ${userId}.`)
  }

  return Promise.all(requests);
}

function handlePluralz(event) {
  if (Math.random() < 0.35) {
    console.log("Deciding to stay quiet for this pluralz.");
    return;
  }

  return reactToMessage(event, "3play");
}

function reactToMessage(event, reaction) {
  const { ts, channel } = event;

  return axios(slackz.reactToPluralz( { ts, channel, reaction })).then(response => {
    logResponse(response, "reaction");
  }).catch(err => {
    logError(err, "reaction");
  });
}

function suggestPluralz({ userId, channel }) {
  return axios(slackz.suggestion({ userId, channel })).then(response => {
    userz.touch(userId);
    logResponse(response, "suggestion");
  }).catch(err => {
    logError(err, "suggestion");
  });
}

function reauth({ userId, channel }) {
  return axios(slackz.reauth({ userId, channel })).then(response => {
    userz.touch(userId);
    logResponse(response, "reauth");
  }).catch(err => {
    logError(err, "reauth");
  });
}

function correctPluralz({ userId, ts, text, channel, token }) {
  return axios(slackz.correction({ ts, text, channel, token })).then(response => {
    logResponse(response, "correction");
    const { ok, error } = response.data || {};
    if (!ok && error === 'invalid_auth') {
      console.log("Requesting reauth");
      return reauth({ userId, channel });
    }
  }).catch(err => {
    logError(err, "correction");
  });
}

function handleOauthRequest({ user, response_url, value }) {
  if (value === 'grant') {
    return axios(slackz.requestOauth({ response_url })).then(response => {
      logResponse(response, "request oauth");
    }).catch(err => {
      logError(err, "request oauth");
    });
  } else if (value === 'cancel') {
    return Promise.all([
      userz.setParticipation(user.id, 'remind', {name: user.name}),
      axios(slackz.cancelOauth({ response_url })).then(response => {
        logResponse(response, "cancel oauth");
      }).catch(err => {
        logError(err, "cancel oauth");
      }),
    ])
  }
}

function setPrefs({ user, value, response_url }) {
  console.log(`Setting user ${user.id} to ${value}`);
  return Promise.all([
    userz.setParticipation(user.id, value, {name: user.name}),
    axios(slackz.acknowledgePrefs({ value, response_url })).then(response => {
      logResponse(response, "user interaction");
    }).catch(err => {
      logError(err, "user interaction");
    }),
  ]);
}

function setUsername({ id, name }) {
  return userz.setName(id, name);
}
