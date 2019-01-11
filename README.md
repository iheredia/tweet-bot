# tweet-bot 

Bot that uses Twitter api's to tweet text strings and gifs

[![NPM](https://nodei.co/npm/@iheredia/tweet-bot.png?mini=true)](https://www.npmjs.com/package/@iheredia/tweet-bot)

## Installation

`npm install @iheredia/tweet-bot`

## Usage
```javascript

const TweetBot = require('@iheredia/tweet-bot');
const secrets = { // Replace with your own! 
  "consumer_key": "",
  "consumer_secret": "",
  "access_token_key": "",
  "access_token_secret": ""  
};
const tweetBot = new TweetBot({secrets: secrets});

tweetBot.tweet({
  status: 'Hello world',        
});

tweetBot.tweet({
  status: 'Hello world - with a gif attached',
  mediaPath: '/path/to/my/image.gif',        
});

tweetBot.tweet({
  status: 'I can also be verbose',
  verbose: true        
});
```