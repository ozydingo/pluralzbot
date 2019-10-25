const BOT_TOKEN = process.env["BOT_TOKEN"];

const pluralz = require('./pluralz');

const authHeaders = (token) => ({
  "Authorization": `Bearer ${token}`,
  "Content-type": "application/json; charset=utf-8",
});

const noAuthHeaders = {
  "Content-type": "application/json; charset=utf-8",
};

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

function responseForPref(value) {
  if (value === 'ignore') {
    return "Ok, I won't bug you again!";
  } else if (value === 'remind') {
    return "Sure, I'll remind you in a little while if you do it again!";
  } else if (value === 'autocorrect') {
    return "~I'm on it!~ Actually, I can't do that yet, because I need some oauth work. I'm working on it!";
  }
}

exports.suggestion = ({ userId, channel }) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: 'It lookz like you may have made some spelling errorz. Would you like to correct your mistakez?',
      }
    },
    {
      type: "actions",
      elements: [
        settingsButton({text: "Correct me", value: "autocorrect"}),
        settingsButton({text: "Remind me later", value: "remind"}),
        settingsButton({text: "Please stop", value: "ignore"}),
      ]
    },
    // {
    //   type: "section",
    //   text: {
    //     type: "mrkdwn",
    //     text: [
    //       "*Correct me*: Automatically correct my mistakez for me.",
    //       "*Remind me*: I got this, but remind me in a little while if I do it again.",
    //       "*Shame me*: Announce to the channel that I've made a terrible mistake.",
    //       "*Please stop*: Please stop bugging me.",
    //     ].join("\n")
    //   }
    // }
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
    data: {
      text: responseForPref(value),
    }
  }
}
