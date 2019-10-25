const BOT_TOKEN = process.env["BOT_TOKEN"];

const pluralz = require('./pluralz');

const headers = (token) => ({
  "Authorization": `Bearer ${token}`,
  "Content-type": "application/json; charset=utf-8"
});

exports.suggestion = ({ userId, channel }) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: pluralz.suggestion,
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
