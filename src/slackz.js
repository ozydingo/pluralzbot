const BOT_TOKEN = process.env["BOT_TOKEN"];
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const pluralz = require('./pluralz');

const authHeaders = (token) => ({
  "Authorization": `Bearer ${token}`,
  "Content-type": "application/json; charset=utf-8",
});

const noAuthHeaders = {
  "Content-type": "application/json; charset=utf-8",
};
const oauthUrl = `https://slack.com/oauth/v2/authorize?user_scope=chat:write&client_id=${CLIENT_ID}`;

function settingsButton({ text, value }) {
  return {
    type: "button",
    value: value,
    text: {
      type: "plain_text",
      text: text
    },
  }
}

const actionBlock = {
  type: "actions",
  elements: [
    settingsButton({text: "Correct me", value: "autocorrect"}),
    settingsButton({text: "Remind me later", value: "remind"}),
    settingsButton({text: "Please stop", value: "ignore"}),
  ]
}

function responseForPref(value) {
  if (value === 'ignore') {
    return {
      text: "Ok, I won't bug you again! If you change your mind, just type `/pluralz`."
    };
  } else if (value === 'remind') {
    return {
      text: "Sure, I'll remind you in a little while if you do it again! You can also type `/pluralz` to get my attention again."
    };
  } else if (value === 'autocorrect') {
    return {
      text: `Sure! You need to authorize me to do that -- [click here](${oauthUrl})`,
    };
  }
}

function settingsInquiry({ userId, channel, text }) {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: text,
      }
    },
    actionBlock,
  ]

  const data = {
    blocks: blocks,
    channel: channel,
    user: userId,
  };

  return {
    method: 'POST',
    url: 'https://slack.com/api/chat.postEphemeral',
    headers: authHeaders(BOT_TOKEN),
    data: data,
  };
}

exports.suggestion = ({ userId, channel }) => {
  return settingsInquiry({
    userId,
    channel,
    text: 'It lookz like you may have made some spelling errorz. Would you like to correct your mistakez?',
  });
}

exports.settingsInquiry = ({ userId, channel }) => {
  return settingsInquiry({
    userId,
    channel,
    text: 'How would you like me to correct your mistakez?',
  });
}

exports.correction = ({ ts, text, channel, token }) => {
  const data = {
    text: pluralz.replace(text),
    ts: ts,
    channel: channel,
    as_user: true,
  };

  return {
    method: 'POST',
    url: 'https://slack.com/api/chat.update',
    headers: authHeaders(token),
    data: data,
  };
}

exports.acknowledgePrefs = ({ value, response_url }) => {
  return {
    method: 'POST',
    url: response_url,
    headers: noAuthHeaders,
    data: responseForPref(value),
  }
}

exports.getOauthCode = () => {
  return {
    method: 'GET',
    url: `https://slack.com/oauth/v2/authorize?user_scope=chat:write&client_id=${CLIENT_ID}`,
  }
}

exports.exchangeOauthCode = (code) => {
  return {
    method: 'POST',
    url: 'https://slack.com/api/oauth.v2.access',
    data: `code=${code}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  }
}
