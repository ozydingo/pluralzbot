# PluralzBot
A Slack app to obnoxiously ask to change your messages for you. Slack + Google Cloud Functions + Google Firestore.

## What is doez

PluralzBot will watch your messages in installed channels for any messages that end in a plural word spelled with an 's'. It will then ~obnoxiously~ kindly suggest you change this spelling to end in a 'z'. If you authorize it, it will automatically correct these errorz for you.

You can tell PluralzBot to stop bugging you at any time. Either use the buttons presented in its gentle inquiry or summon in using `/pluralz`

## Code Setup

* Type `npm install` from `/src` to install the needed dependencies locally.
* Run `npm run lint` to lint your code.
* Run `npm run test` to run the test suite.
  * Beware, it only covers some basic isolated logic. The benefit of testing the specific Slack inbound and outbound messages is questionable, and of testing Firestore interactions was more than I cared to take on.

## App Setup

PluralzBot is hosted on Google Cloud Platform using a Node.js 8 runtime cloud function and a Firestore database to hold user preferences. It is deployed via a Google Source Repository ([here](https://source.cloud.google.com/playground-252414/pluralzbot)). More details as follows:

* Set the function's source repository and branch (master unless you have a better idea).
* Set the directory with source code to `/src`.
* Set "Function to execute" to `main`.
  * This function will automatically detect if Slack is sending a verification challenge and respond accordingly, so you don't have to worry about that.
* Set up the following environment variables
  * `BOT_TOKEN`: the oauth token labeled "bot" in your Slack app. This is needed to perform most of PuralzBot's primary actions.
  * `CHANNEL_WHITELIST`: a comma-separated list of channel ids that PluralzBot will respond to. This is for safety -- this is an obnoxious app.
  * `CLIENT_ID`: from your Slack app's basic info. This is needed when a user is authorizing the application to autocorrect their messages.
  * `CLIENT_SECRET`: from your Slack app's basic info. This is needed when a user is authorizing the application to autocorrect their messages.
  * `BUG_TIMEOUT`: minimum time, in minutes, between responses that PluralzBot will send to a given user when they are not set to ignore or autocorrect. Let's not be *too* obnoxious.
  * `VERIFICATION_TOKEN`: from your Slack app's info. This verifies that requests are coming from Slack. (TODO: implement signature verification.)

## Slack Setup

* Set up the Slack app to subscribe to the following events:
  * `message.channels`
  * `message.groups`
* Set the event subscription URL to be the function's trigger with `?action=event` appended.
* Give the Slack app the following scopes:
  * bot
  * commands
  * channels:history
  * groups:history
  * chat:write:user
  * chat:write:bot
* Set up the oauth redirect URL to the same function's trigger address with `?action=oauth` appended.
* Set up a slack command `/pluralz` with a request URL of the function's trigger with `?action=command` appended.
* Enabled Interactive Components with a request URL of the function's trigger with `?action=response` appended.
* Add a bot user.
* Set your app's logo to the image file contained in `assets/logo.png`.

## Notes

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
