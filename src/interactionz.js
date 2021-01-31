const bug_timeout = Number(process.env.BUG_TIMEOUT || 15);
const BUG_TIMEOUT_MILLIS = bug_timeout * 60 * 1000;
const REACTION_PROB = Number(process.env.REACTION_PROB || 0.35);

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
  return Math.random() < REACTION_PROB;
}

module.exports = {
  timeToBugAgain,
  messageAction,
  ignorePluralz,
};
