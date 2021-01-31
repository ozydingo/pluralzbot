# PluralzBot

## Overview

A Slack app that will obnoxiously change your messagez spellingz. What could go wrong?

## What is doez

PluralzBot will watch your messages in installed channelz for any messagez that contain plural wordz incorrectly spelled with an "s". Then, if authorized, it will autobnoxiously correct your spelling to end your wordz with a "z".

But, more seriously, Pluralzbot is opt-in, and  gives you the option to permanently dismiss its prompts.Simply summon the bot's suggestions  using the `/pluralz` slash command enabled in your workspace.

## Where it livez

Pluralzbot consists of a single Google Cloud Function and a Google Firestore database. The function is deployed from its [google cloudrepository](https://source.developers.google.com/p/enhanced-optics-219215/r/pluralz).

## Development

Note: these instructions are for setting up the app from scratch. If you are just trying to use the app in your workspace, skip this section.

### Code Setup

* Navigate to `/src`
* Run `npm install` in install package dependencies.
* Run `npm run lint` to lint your code.
* Run `npm run test` to run the test suite.
  * Beware, it only covers some basic isolated logic. The benefit of testing the specific Slack inbound and outbound messages is questionable, and of testing Firestore interactions was more than I cared to take on.

### Initialize Slack App

Before we set up our Google Cloud infrastructure, we need to set up a few things in Slack, including the app identity and secrets.

* [Create the Slack app](https://api.slack.com/apps).
* Upload the [logo](./assets/logo.png) and use background color #269ba3.
* In Oauth/Scopes, Create a [bot token](https://api.slack.com/bot-users) and add the following bot scopes:
  * Add the `chat.write` scope to allow PluralzBot to ask members for authorization to correct their pluralz.
  * Add `reactions.write` to allow PluralzBot to react when members use the correct endingz for plural wordz.
* Add user token scopes:
  * Add `chat.write` to allow PluralzBot to update authorized users' chatz.
* Install the app to your test workspace to generate tokens.
* Copy the "Bot Token" value into the gitignored file`src/env/secrets.yml`
  * `BOT_TOKEN: xoxb-...`
* Go to "Basic Information", and copy the client id, secret, and verification token into `src/env/secrets.yml` using the following keys:
  * `CLIENT_ID` -- note!, quote this value, since it will otherwise be parsed as a Float!
  * `CLIENT_SECRET`
  * `VERIFICATION_TOKEN`
* Add `BUG_TIMEOUT: 15` to `src/env/secrets.yml`. This is nota secret, but GCP Functions only supports a single env file as of this writing.
  * TODO: Store secrets more securely, use env file only for non-secret environment setup.

### App Setup on Google Cloud

We're now ready to deploy our GCP stack that will power our app.

#### Firstore Database

We'll store information on who has authorized PluralzBot to correct and who has told PluralzBot to bug off in a [Firestore Database](https://cloud.google.com/firestore). Create one in the console or via the CLI using

```sh
gcloud firestore databases create --region=us-east1
```

#### Google Cloud Functions

Deploy the function. Here, we're deploying it from a Google Code Repository; change this as you require. Note: this step requires you to enable the Cloud Build API in GCP.

```sh
gcloud functions deploy pluralz --region us-east1 --trigger-http --allow-unauthenticated --runtime nodejs14 --source https://source.developers.google.com/projects/enhanced-optics-219215/repos/pluralz/moveable-aliases/master/paths/src/ --entry-point main --env-vars-file ./env/secrets.yml
```

Alternatively, set up the cloud function in the GCP console, copying the source path, entry point, and environment variables from the command above.

Get the function trigger URL:

```sh
gcloud functions describe pluralz --format="value(httpsTrigger.url)"
```

This should look like `https://enhanced-optics-219215.cloudfunctions.net/pluralz`. We'll copy this into our Slack app.

Lastly, give the function permission to read and write to our Firestore database:

<!-- TODO --- THIS -->

### Connect Slack App

We'll use the same function for challenge verification, event subscription, and oauth handling because the amount of shared code between these handlers outweighs their differences. To keep things tidy, each URL will have an `action=<ACTION>` parameter, and these are parsed immediately in `index.js:main` and routed to the correct function imported from `controllers`.

* Add an OAuth Redirect URL to allow users to grant permission to PluralzBot.
  * `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=oauth`
* Enable "Event Subscription".
  * Add the URL `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=event`
* Subscribe to the `message.channels` and `message.groups` bot events. We're leaving out IM and MPIM since pluralzBot is most effective in named channels, not direct messages.
* Add a slash command, `/pluralz`
  * URL: `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=command`
  * Description: "Modify your Pluralz settingz"
* Enabled interactivity.
  * URL: `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=response`
* Reinstall the app to gain new scopes. You may notice that the actions above have caused Slack to automatically add the following scopes:
  * `channels.history`
  * `commands`
  * `groups.history`

### Notes

This is what a message post event looks like to the function:

```
"{ token: 'abc123',
  team_id: 'TABC123',
  api_app_id: 'AABC123',
  event:
   { client_msg_id: 'uuid-numbers-and-letters',
     type: 'message',
     text: 'hello, world',
     user: 'UABC123',
     ts: '1234567890.000000',
     team: 'T0JRWG6CC',
     channel: 'GABC123',
     event_ts: '1234567890.000000',
     channel_type: 'group' },
  type: 'event_callback',
  event_id: 'EABC123',
  event_time: 1234567890,
  authed_users: [ 'UABC123' ] }"
```

Block action payload:

```
{
	"type": "block_actions",
	"team": {
		"id": "T0CAG",
		"domain": "acme-creamery"
	},
	"user": {
		"id": "U0CA5",
		"username": "Amy McGee",
		"name": "Amy McGee",
		"team_id": "T3MDE"
	},
	"api_app_id": "A0CA5",
	"token": "Shh_its_a_seekrit",
	"container": {
		"type": "message",
		"text": "The contents of the original message where the action originated"
	},
	"trigger_id": "12466734323.1395872398",
	"response_url": "https://www.postresponsestome.com/T123567/1509734234",
	"actions": [
		{
			"type": "button",
			"block_id": "XG9=a",
			"action_id": "123",
			"text": {
				"type": "plain_text",
				"text": "Button",
				"emoji": true
			},
			"value": "click_me_123",
			"action_ts": "1572000048.172717"
		}
	]
}
```

Oauth redirect query params, which can include any specified in the redirect_uri

```
{
  code: a_very_long_string, state: ''
}
```

Oauth code exchange response

```
{
    "ok": true,
    "access_token": "xoxb-17653672481-19874698323-pdFZKVeTuE8sk7oOcBrzbqgy",
    "token_type": "bot",
    "scope": "commands,incoming-webhook",
    "bot_user_id": "U0KRQLJ9H",
    "app_id": "A0KRD7HC3",
    "team": {
        "name": "Slack Softball Team",
        "id": "T9TK3CUKW"
    },
    "enterprise": {
        "name": "slack-sports",
        "id": "E12345678"
    },
    "authed_user": {
        "id": "U1234",
        "scope": "chat:write",
        "access_token": "xoxp-1234",
        "token_type": "user"
    }
}
```
