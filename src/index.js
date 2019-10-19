const BOT_TOKEN = process.env["BOT_TOKEN"];
const channel = process.env["TEST_CHANNEL"];

const axios = require('axios');

const botHeaders = {
  "Authorization": `Bearer ${BOT_TOKEN}`,
  "Content-type": "application/json; charset=utf-8",
};

// Respond to initial challenge when adding URL to the Slack app.
// This function is not needed thereafter.
exports.verify = (req, res) => {
  const body = req.body;
  if (body.challenge) {
    res.status(200).send(body.challenge);
  }
}

// Main event function handler
exports.main = async (req, res) => {
  const body = req.body;
  console.log(body);

  // event fields: { client_msg_id, user, ts, text, channel }
  const event = body.event || {};
  const { text } = event;

  if (eventInScope(event) && hasPlural(text)) {
    await handlePluralz(event);
  }

  res.status(200).send('');
};

function eventInScope(event) {
  const { text, channel, type, subtype } = event;

  if (channel !== channel) { return false; }
  if (subtype === "message_changed" ) { return false; }
  if (!text) { return false; }

  return true
}

function getUserToken(user) {
  // TODO: Look up from db store based on `user`
  return null;
}

function handlePluralz(event) {
  const { user } = event;
  const token = getUserToken(user);
  if (token) {
    postPluralz(event, token);
  } else {
    suggestPluralz(event);
  }
}

function hasPlural(text) {
  // Rough cut: ends in s following a non-s consonant,
  // and is at least four letters long
  return (
    text.length >= 4 &&
    /\w+s$/.test(text) &&
    !/[aeious]/.test(text[text.length-2])
  )
}

function correctText(text) {
  return text.replace(/\b(\w+)s$/g, "$1z");
}

function userHeaders(token) {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-type": "application/json; charset=utf-8"
  };
}

function suggestPluralz({ user, channel }) {
  // TODO: use postEphemeral with interactive component the install app
  // Or, not ephemeral because that's more fun
  axios({
    method: 'POST',
    url: 'https://slack.com/api/chat.postEphemeral',
    headers: botHeaders,
    data: {
      text: 'Hi therez! It lookz like you may have made some errorz in spelling plural words. Would you like to correct your mistakez by using "z" for pluralz?',
      channel: channel,
      user: user,
    },
  }).then(response => console.log("Response for suggestion:", response.data));
}

function postPluralz({ ts, text, channel }, token) {
  const data = {
    text: correctText(text),
    ts: ts,
    channel: channel,
    as_user: true,
  };
  axios({
    method: 'POST',
    url: 'https://slack.com/api/chat.update',
    headers: userHeaders(token),
    data: data,
  }).then(response => console.log("Response for correction:", response.data));
}
