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
7. Deploy the function and start typing in the slack channel!

## Deploy

You could keep copy + pasting, but doesn't that just make you feel a little dirty and cheap?

Set up your function's source from a Google Source Repository. For example, I have two remotes: origin (github) and google, where the function is sources. To deploy, push to google master, then go into the function in the GCP console, edit, edploy.

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
