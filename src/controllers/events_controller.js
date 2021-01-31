const axios = require('axios');
const interactionz = require('../interactionz');
const { logError, logResponse } = require('../logging');
const slackz = require('../slackz');
const userz = require('../userz');

const { Pluralz } = require('../pluralz');

async function respond(req, res) {
  const { body } = req;
  if (!body.event) {
    console.log("No event detected in body; abort.");
    res.status(200).send();
    return;
  }

  res.status(200).write('');
  console.log("Handling event: " + JSON.stringify(body.event));
  console.log(`Event type: ${body.event.type}`);
  await handleEvent(body.event);
  res.end();
}

async function handleEvent(event) {
  const { text } = event;

  if (event.type === "message" && !event.subtype) {
    const actions = [];
    const pluralz = new Pluralz(text);
    if (pluralz.hasPlurals()) {
      console.log("Text contains plurals to be corrected.");
      actions.push(handlePlurals(event, pluralz));
    }
    if (pluralz.hasPluralz()) {
      console.log("Text contains pluralz to be commended.");
      actions.push(handlePluralz(event));
    }
    if (actions.length === 0) {
      console.log("No action to perform.");
    }
    return Promise.all(actions);
  }
}

async function handlePlurals(event, pluralz) {
  const { ts, text, channel, user: userId, team: teamId } = event;
  const user = await userz.find_or_create({userId, teamId});
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
    console.log(`Pluralz: ignore user ${userId}.`);
  } else if (action === "correct") {
    console.log(`Pluralz: correct user ${userId}.`);
    requests.push(correctPluralz({ userId, ts, newText: pluralz.replace(text), channel, token: userData.token }));
  } else if (action === "reauth") {
    console.log(`Pluralz: requesting token for user ${userId}.`);
    requests.push(reauth({ userId, teamId, channel }));
  } else if (action === "suggest") {
    console.log(`Pluralz: time to bug user ${userId}! Last bug time: ${userData.bugged_at && userData.bugged_at.toDate()}`);
    requests.push(suggestPluralz({ userId, teamId, channel }));
  } else {
    console.log(`Pluralz: we're hiding from user ${userId}.`);
  }

  return Promise.all(requests);
}

function handlePluralz(event) {
  if (interactionz.ignorePluralz()) {
    console.log("Deciding to stay quiet for this pluralz.");
    return;
  }

  return reactToMessage(event, "zzz");
}

function reactToMessage(event, reaction) {
  const { ts, channel } = event;

  return axios(slackz.reactToPluralz( { ts, channel, reaction })).then(response => {
    logResponse(response, "reaction");
  }).catch(err => {
    logError(err, "reaction");
  });
}

function suggestPluralz({ userId, teamId, channel }) {
  return axios(slackz.suggestion({ userId, channel })).then(response => {
    userz.touch({userId, teamId});
    logResponse(response, "suggestion");
  }).catch(err => {
    logError(err, "suggestion");
  });
}

function correctPluralz({ userId, ts, newText, channel, token }) {
  return axios(slackz.editMessage({ token, channel, ts, newText })).then(response => {
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

function reauth({ userId, teamId, channel }) {
  return axios(slackz.reauth({ userId, teamId, channel })).then(response => {
    userz.touch(userId);
    logResponse(response, "reauth");
  }).catch(err => {
    logError(err, "reauth");
  });
}

module.exports = {
  respond
};
