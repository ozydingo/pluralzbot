// const VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN;

const CommandsController = require('./controllers/commands_controller');
const EventsController = require('./controllers/events_controller');
const OauthController = require('./controllers/oauth_controller');
const ResponsesController = require('./controllers/responses_controller');
const VerificationController = require('./controllers/verification_controller');

// Main event function handler
exports.main = async (req, res) => {
  if (process.env.SHUTOFF) {
    console.log("SHUTOFF");
    res.status(200).send('');
    return;
  }

  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  // TODO: not all POSTS have the token. Figure this out.
  // if (body.token !== VERIFICATION_TOKEN) {
  //   res.status(501).send('Unauthorised request.');
  //   return;
  // }

  // Allow re-verification of URL by Slack
  if (body.challenge) {
    await VerificationController.respond(req, res);
  } else if (query.action === 'event') {
    await EventsController.respond(req, res);
  } else if (query.action === 'response') {
    await ResponsesController.respond(req, res);
  } else if (query.action === 'command') {
    await CommandsController.respond(req, res);
  } else if (query.action === 'oauth') {
    await OauthController.respond(req, res);
  } else {
    res.status(404).send('No action to perform.');
  }
};
