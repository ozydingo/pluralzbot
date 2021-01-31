// const VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN;

const CommandsController = require('./controllers/commands_controller');
const EventsController = require('./controllers/events_controller');
const OauthController = require('./controllers/oauth_controller');
const ResponsesController = require('./controllers/responses_controller');
const VerificationController = require('./controllers/verification_controller');

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;

  if (process.env.VERBOSE) {
    console.log(JSON.stringify({body, query}));
  }

  if (process.env.SHUTOFF) {
    console.log("SHUTOFF");
    res.status(200).send('');
    return;
  }

  // TODO: not all POSTS have the token. Figure this out.
  // if (body.token !== VERIFICATION_TOKEN) {
  //   res.status(501).send('Unauthorised request.');
  //   return;
  // }

  // Allow re-verification of URL by Slack
  if (body.challenge) {
    console.log("Body contains a challenge; responding.");
    await VerificationController.respond(req, res);
  } else if (query.action === 'event') {
    console.log("Handling event.");
    await EventsController.respond(req, res);
  } else if (query.action === 'response') {
    console.log("Handling interaction response.");
    await ResponsesController.respond(req, res);
  } else if (query.action === 'command') {
    console.log("Handling slash command.");
    await CommandsController.respond(req, res);
  } else if (query.action === 'oauth') {
    console.log("Handling oauth action.");
    await OauthController.respond(req, res);
  } else {
    console.log(`No action (value is ${query.action}); abort.`);
    res.status(404).send(`No action to perform for action ${query.action}.`);
  }
};
