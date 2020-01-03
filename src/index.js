const Twitter = require('twitter');
const MediaUploader = require('./media-uploader');

class TweetBot {

  /*
  * secrets: object with "consumer_key", "consumer_secret", "access_token_key"
  *          and "access_token_secret"
  * */
  constructor ({secrets, verbose}) {
    this.client = new Twitter(secrets);
    this.preventTweet = false;
    this.verbose = verbose;
    this.log = (msg) => this.verbose ? console.log(msg) : null;
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
      return this.log(logMsg);
    }

    let mediaPromise;
    if (mediaPath) {
      const mediaUploader = new MediaUploader({
        client: this.client,
        mediaPath: mediaPath,
        verbose: this.verbose
      });
      mediaPromise = mediaUploader.upload()
    } else {
      mediaPromise = Promise.resolve()
    }
    mediaPromise.then(mediaId => {
      this.mediaId = mediaId;
      this._updateStatus();
    })
  }

  _updateStatus () {
    const postOptions = {
      status: this.status,
      media_ids: this.mediaId
    };
    this.log(postOptions);
    this.log(`Tweeting "${postOptions.status}"`);
    if (postOptions.media_ids) this.log(` with media ${postOptions.media_ids}`);
    this.client.post('statuses/update', postOptions, (error) => {
      if (error) return this.log(error);
      this.log(`Tweeting "${postOptions.status}" ✓`);
    });
  }
}

module.exports = TweetBot;