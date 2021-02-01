const axios = require('axios');
const { logError, logResponse } = require('../logging');
const slackz = require('../slackz');
const userz = require('../userz');
const { validateToken } = require('../verification');

async function respond(req, res) {
  const { body } = req;
  if (!body.payload) {
    console.log("Body contains no payload; abort.");
    res.status(200).send();
    return;
  }
  const payload = JSON.parse(body.payload);
  validateToken(payload.token);

  res.status(200).write('');
  console.log(`Handling response: ${body.payload}`);
  await handleResponse(payload);
  res.end();
}

async function handleResponse(payload) {
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
    userz.setParticipation(value, {userId: user.id, teamId: user.team_id, name: user.name}),
    axios(slackz.acknowledgePrefs({ value, response_url })).then(response => {
      logResponse(response, "user interaction");
    }).catch(err => {
      logError(err, "user interaction");
    }),
  ]);
}

function setUsername({ id, team_id, name }) {
  return userz.setName(name, {userId: id, teamId: team_id});
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
      userz.setParticipation('remind', {userId: user.id, teamId: user.team_id, name: user.name}),
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
