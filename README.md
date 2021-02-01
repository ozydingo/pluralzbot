# PluralzBot

## Overview

A Slack app that will obnoxiously change your messagez spellingz. What could go wrong?

## What is doez

PluralzBot will watch your messages in installed channelz for any messagez that contain plural wordz incorrectly spelled with an "s". Then, if authorized, it will autobnoxiously correct your spelling to end your wordz with a "z".

But, more seriously, Pluralzbot is opt-in, and  gives you the option to permanently dismiss its prompts.Simply summon the bot's suggestions  using the `/pluralz` slash command enabled in your workspace.

## What makez it go

Pluralzbot consists of a single Google Cloud Function and a Google Firestore database.

## Development

Note: these instructions are for setting up the app from scratch. If you are just trying to use the app in your workspace, simply search for it in Slack.

### Code Setup

* Navigate to `/src`
* Run `npm install` in install package dependencies.
* Run `npm run lint` to lint your code.
* Run `npm run test` to run the test suite.
  * Be warned: the test suite is limited and does not yet cover the Slack and Firestore interactions due to cost/benefit of mocking these features' responses.

### Initialize Slack App

Before we set up our Google Cloud infrastructure, we need to set up a few things in Slack, including the app identity and secrets.

* [Create the Slack app](https://api.slack.com/apps).
* Upload the [logo](./assets/logo.png) and use background color #269ba3.
* In Oauth/Scopes, Create a [bot token](https://api.slack.com/bot-users).
* Add the following bot scopes:
  * `chat:write` -- allow PluralzBot to respond with messages.
  * `reactions:write` -- allow PluralzBot to react to pluralz.
* Add user scopes:
  * `chat.write` -- allow PluralzBot to auto-correct users' chatz.
* Install the app to your test workspace to generate tokens.
* Copy the "Bot Token" value into the gitignored file`src/env/secrets.yml`
  * `BOT_TOKEN: xoxb-...`
* Go to "Basic Information", and copy the client id, secret, and verification token into `src/env/secrets.yml` using the following keys:
  * `CLIENT_ID` -- note!, quote this value, since it will otherwise be parsed as a Float.
  * `CLIENT_SECRET`
  * `VERIFICATION_TOKEN`

### App Setup on Google Cloud

We're now ready to deploy our GCP stack that will power our app.

#### Firstore Database

We'll store information on who has authorized PluralzBot to correct and who has told PluralzBot to bug off in a [Firestore Database](https://cloud.google.com/firestore). Create one in the console or via the CLI using

```sh
gcloud firestore databases create --region=us-east1
```

#### Google Cloud Functions

Deploy the function. Here, we're deploying it from local disk; see appendix for deploying from its Google Cloud Repository instead for a more stable deploy process.

```sh
gcloud functions deploy pluralz --region us-east1 --trigger-http --allow-unauthenticated --runtime nodejs14 --source . --entry-point main --env-vars-file ./env/secrets.yml
```

(Alternatively, use the GCP console to the same effect.)

Get the function trigger URL:

```sh
gcloud functions describe pluralz --format="value(httpsTrigger.url)"
```

This should look like `https://enhanced-optics-219215.cloudfunctions.net/pluralz`. We'll copy this into our Slack app.

### Connect Slack App

For simplicity and code-sharing, we use the same function with different query parameters for various actions from Slack. The `main` function serves as a rouuterr to decide which functio in `controllers` will respond.

* Add an OAuth Redirect URL to allow users to grant permission to PluralzBot.
  * `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=oauth`
* Enable "Event Subscriptions".
  * Add the URL `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=event`
* Subscribe to the `message.channels` and `message.groups` bot events. We're leaving out IM and MPIM since pluralzBot is most effective in named channels, not direct messages.
* Add a slash command, `/pluralz`
  * URL: `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=command`
  * Description: "Modify your Pluralz settingz"
* Enable interactivity.
  * URL: `https://us-central1-enhanced-optics-219215.cloudfunctions.net/pluralz?action=response`
* Reinstall the app to grant the following new scopes automatically added by the above actions:
  * `channels.history`
  * `commands`
  * `groups.history`

The app should be good to go! Simply add the PluralzBot app to any channel and try typing a message like "I like words" in that channel.

### Appendix

See the `example_data` directory for example data from various responnse types.

To deploy the function from its Google Cloud Repository, use the following `gcloud` invocation. Note: this step requires you to enable the Cloud Build API in GCP.

```sh
gcloud functions deploy pluralz --region us-east1 --trigger-http --allow-unauthenticated --runtime nodejs14 --source https://source.developers.google.com/projects/enhanced-optics-219215/repos/pluralz/moveable-aliases/master/paths/src/ --entry-point main --env-vars-file ./env/secrets.yml
```
