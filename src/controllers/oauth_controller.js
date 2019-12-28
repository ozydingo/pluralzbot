const axios = require('axios');
const { logError, logResponse } = require('../logging');
const meta = require('../meta');
const slackz = require('../slackz');
const userz = require('../userz');

async function respond(req, res) {
  const { query } = req;
  const { ok } = await handleOauthRedirect(query);
  if (ok) {
    res.status(200).sendFile(meta.basedir + '/pages/oauth_success.html');
  } else {
    res.status(200).sendFile(meta.basedir + '/pages/oauth_failure.html');
  }
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
  console.log("Oauth result:", result);
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

module.exports = {
  respond
};
