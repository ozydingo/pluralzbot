const axios = require('axios');
const { logError, logResponse } = require('../logging');
const slackz = require('../slackz');
const userz = require('../userz');

async function respond(req, res) {
  const { body } = req;
  if (!body.payload) {
    res.status(200).send();
    return;
  }

  res.status(200).write('');
  await handleResponse(body.payload);
  res.end();
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
    ]);
  }
}

module.exports = {
  respond
};
