const axios = require('axios');
const interactionz = require('../interactionz');
const { logError, logResponse } = require('../logging');
const slackz = require('../slackz');
const userz = require('../userz');

const { Z } = require('../z');

async function respond(req, res) {
  const { body } = req;
  if (!body.event) {
    res.status(200).send();
    return
  }

  res.status(200).write('');
  await handleEvent(body.event);
  res.end();
}

async function handleEvent(event) {
  console.log("Handling event", event);
  const { text } = event;

  if (event.type === 'app_mention') {
    return reactToMessage(event, "bananadance");
  } else if (event.type === "message" && !event.subtype) {
    const actions = [];
    const z = new Z(text);
    if (z.hasPlurals()) {
      actions.push(handlePlurals(event, z))
    }
    if (z.hasPluralz()) {
      actions.push(handlePluralz(event));
    }
    return Promise.all(actions);
  }
}

async function handlePlurals(event, z) {
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

  const action = interactionz.messageAction(userData);

  if (action === "ignore") {
    console.log(`Pluralz: ignore user ${userId}.`)
  } else if (action === "correct") {
    console.log(`Pluralz: correct user ${userId}.`)
    requests.push(correctPluralz({ userId, ts, newText: z.replace(text), channel, token: userData.token }));
  } else if (action === "reauth") {
    console.log(`Pluralz: requesting token for user ${userId}.`)
    requests.push(reauth({ userId, channel }));
    axios(slackz.reauth({ userId, channel }))

  } else if (action === "suggest") {
    console.log(`Pluralz: time to bug user ${userId}! Last bug time: ${userData.bugged_at && userData.bugged_at.toDate()}`)
    requests.push(suggestPluralz({ userId, channel }));
  } else {
    console.log(`Pluralz: we're hiding from user ${userId}.`)
  }

  return Promise.all(requests);
}

function handlePluralz(event) {
  if (interactionz.ignorePluralz()) {
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

function correctPluralz({ userId, ts, newText, channel, token }) {
  return axios(slackz.edit({ token, channel, ts, newText })).then(response => {
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

function reauth({ userId, channel }) {
  return axios(slackz.reauth({ userId, channel })).then(response => {
    userz.touch(userId);
    logResponse(response, "reauth");
  }).catch(err => {
    logError(err, "reauth");
  });
}

module.exports = {
  respond
};
