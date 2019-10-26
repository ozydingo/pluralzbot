# pluralzbot
Obnoxiously ask to change your slack messages for you

## What is doez

Pluralzbot will watch your messages in installed channels for any messages that end in a plural word spelled with an 's'. It will then ~obnoxiously~ kindly suggest you change this spelling to end in a 'z'.

Pluralzbot also has the ability to automatically change your messages for you for super convenience. However, this feature is on hold until multi-user token storage is worked out.

## How it doez

1. Create a Google Cloud function using the Node.js 8 runtime.
2. Copy the files in `src` into this function.
3. Set the "Function To Execute" to `verify`.
4. Paste the Google Cloud function http trigger into the Slack app. Verification should succeed.
5. Modify the "Function To Execute" to `main`.
6. Edit the function, scroll down to environment variables. Add the following variables:
  * `BOT_TOKEN`: copy this from the Slack app.
  * `TEST_CHANNEL`: get the channel id that is being monitored (this will soon be removed). Should look like `GABCD1234` (private channel) or `CABCD1234` (public channel)
  * `CLIENT_ID`: client id of the app.
  * `CLIENT_SECRET`: client secret of the app.
7. Deploy the function and start typing in the slack channel!

## Deploy

You could keep copy + pasting, but doesn't that just make you feel a little dirty and cheap?

Set up your function's source from a Google Source Repository. For example, I have two remotes: origin (github) and google, where the function is sources. To deploy, push to google master, then go into the function in the GCP console, edit, edploy.

## Oauth

PluralzBot requires the following scopes:

* bot
* commands
* channels:history
* groups:history
* chat:write:user
* chat:write:bot

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
