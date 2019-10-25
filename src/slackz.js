const BOT_TOKEN = process.env["BOT_TOKEN"];

const pluralz = require('./pluralz');

const headers = (token) => ({
  "Authorization": `Bearer ${token}`,
  "Content-type": "application/json; charset=utf-8"
});

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

exports.suggestion = ({ userId, channel }) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: 'Hi therez! It lookz like you may have made some spelling errorz. Would you like to correct your mistakez by using "z" for pluralz?',
      }
    },
    {
      type: "actions",
      elements: [
        settingsButton({text: "Correct me", value: "autocorrect"}),
        settingsButton({text: "Remind me", value: "private"}),
        settingsButton({text: "Shame me", value: "public"}),
        settingsButton({text: "Please stop", value: "ignore"}),
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          "*Correct me*: Automatically correct my mistakez for me.",
          "*Remind me*: I got this, but remind me in a little while if I do it again.",
          "*Shame me*: Announce to the channel that I've made a terrible mistake.",
          "*Please stop*: Please stop bugging me.",
        ].join("\n")
      }
    }
  ]

  const data = {
    blocks: blocks,
    channel: channel,
    user: userId,
  };

  return {
    method: 'POST',
    url: 'https://slack.com/api/chat.postEphemeral',
    headers: headers(BOT_TOKEN),
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
    headers: headers(token),
    data: data,
  };
}
