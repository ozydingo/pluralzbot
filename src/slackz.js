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
const oauthUrl = ({ response_url, channel, user_id }) => {
  const state = { response_url, channel, user_id };
  const stateStr = encodeURIComponent(JSON.stringify(state));
  const paramstr = `user_scope=chat:write&client_id=${CLIENT_ID}&state=${stateStr}`
  return `https://slack.com/oauth/v2/authorize?${paramstr}`;
}

function settingsButton({ text, value, style }) {
  const button = {
    type: "button",
    value: value,
    text: {
      type: "plain_text",
      text: text,
    },
  };
  if (style) { button.style = style; }
  return button;
}

const actionBlock = {
  type: "actions",
  block_id: "set-prefs",
  elements: [
    settingsButton({text: "Correct me", value: "autocorrect", style: "primary"}),
    settingsButton({text: "Remind me later", value: "remind"}),
    settingsButton({text: "Please stop", value: "ignore"}),
  ]
}

const oauthBlocks = ({ state, message }) => (
  [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: message,
      }
    },
    {
      type: "actions",
      block_id: "oauth-access",
      elements: [
        {
          type: "button",
          value: "grant",
          style: "primary",
          text: {
            type: "plain_text",
            text: "Grant access",
          },
          url: oauthUrl(state),
        },
        {
          type: "button",
          value: "cancel",
          text: {
            type: "plain_text",
            text: "Cancel",
          },
        },
      ]
    }
  ]
)

function responseForPref({ value, response_url }) {
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
      blocks: oauthBlocks({
        state: { response_url },
        message: "Sure! To get started, you'll need to authorize me to edit your messagez."
      })
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

exports.reauth = ({ userId, channel }) => {
  const msg = "Uh oh! You've asked me to help out your spellingz, but I don't have a working authorization token! Please grant me access or update your settings.";
  const data = {
    blocks: oauthBlocks({
      state: { channel, user_id: userId },
      message: msg
    }),
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
    data: responseForPref({ value, response_url }),
  }
}

exports.requestOauth = ({ response_url }) => {
  return {
    method: 'POST',
    url: response_url,
    headers: noAuthHeaders,
    data: {text: "Great, let's get your authorization through Slack."},
  };
}

exports.cancelOauth = ({ response_url }) => {
  return {
    method: 'POST',
    url: response_url,
    headers: noAuthHeaders,
    data: {text: "Sure. I may ask again in a little while."},
  };
}

exports.reactToPluralz = ({ ts, channel }) => {
  return {
    method: 'POST',
    url: 'https://slack.com/api/reactions.add',
    headers: authHeaders(BOT_TOKEN),
    data: {
      channel: channel,
      timestamp: ts,
      name: '3play',
    }
  }
}

exports.exchangeOauthCode = (code) => {
  return {
    method: 'POST',
    url: 'https://slack.com/api/oauth.v2.access',
    data: `code=${code}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  }
}

exports.acknowledgeOauth = ({ ok, message, state }) => {
  console.log("Oauth ack:", state)
  const { response_url, channel, user_id: userId } = state;
  const data = ok ? {text: message} : {
    blocks: oauthBlocks({
      state,
      message: message
    })
  }
  if (response_url) {
    return {
      method: 'POST',
      url: response_url,
      headers: noAuthHeaders,
      data: data,
    }
  } else if (channel && userId) {
    return {
      method: 'POST',
      url: 'https://slack.com/api/chat.postEphemeral',
      headers: authHeaders(BOT_TOKEN),
      data: {
        user: userId,
        channel,
        ...data
      },
    }
  }
}
