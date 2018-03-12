const Twitter = require('twitter');
const MediaUploader = require('./media-uploader');

class TweetBot {

  /*
  * secrets: object with "consumer_key", "consumer_secret", "access_token_key"
  *          and "access_token_secret"
  * */
  constructor ({secrets}) {
    this.client = new Twitter(secrets);
    this.preventTweet = false;
  }

  /*
  * status: string with the final tweet text
  * mediaPath: path to .gif or .mp4 (optional)
  * */
  tweet ({status, mediaPath}) {
    this.status = status || '';

    if (this.preventTweet) {
      const logMsg = `Prevented tweet`
        + (this.status ? ` "${this.status}"` : '')
        + (mediaPath ? ` with media ${mediaPath}` : '');
      return console.log(logMsg);
    }

    let mediaPromise;
    if (mediaPath) {
      const mediaUploader = new MediaUploader({
        client: this.client,
        mediaPath: mediaPath
      });
      mediaPromise = mediaUploader.upload()
    } else {
      mediaPromise = Promise.resolve()
    }
    mediaPromise.then(mediaId => {
      this.mediaId = mediaId;
      this.updateStatus();
    })
  }

  updateStatus () {
    const postOptions = {
      status: this.status,
      media_ids: this.mediaId
    };
    console.log(postOptions);
    console.log(`Tweeting "${postOptions.status}"`);
    if (postOptions.media_ids) console.log(` with media ${postOptions.media_ids}`);
    this.client.post('statuses/update', postOptions, (error) => {
      if (error) return console.trace(error);
      console.log(`Tweeting "${postOptions.status}" ✓`);
    });
  }
}

module.exports = TweetBot;