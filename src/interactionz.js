const bug_timeout = Number(process.env.BUG_TIMEOUT || 1);
const BUG_TIMEOUT_MILLIS = bug_timeout * 60 * 1000;

function timeToBugAgain(buggedAt) {
  return (new Date() - buggedAt) > BUG_TIMEOUT_MILLIS;
}

function messageAction(userData) {
  if (userData.participation === 'ignore') {
    return "ignore";
  } else if (userData.participation === 'autocorrect' && userData.token) {
    return "correct";
  } else if (userData.participation === 'autocorrect' && !userData.token) {
    return "reauth";
  } else if (!userData.participation || !userData.bugged_at || timeToBugAgain(userData.bugged_at.toDate())) {
    return "suggest";
  } else {
    return "wait";
  }
}

function ignorePluralz() {
  return Math.random() < 0.35;
}

module.exports = {
  timeToBugAgain,
  messageAction,
  ignorePluralz,
}
