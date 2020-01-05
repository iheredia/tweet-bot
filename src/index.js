const Twitter = require('twitter');
const MediaUploader = require('./media-uploader');

class TweetBot {

  /*
  * secrets: object with "consumer_key", "consumer_secret", "access_token_key"
  *          and "access_token_secret"
  * */
  constructor ({secrets, verbose}) {
    this.client = new Twitter(secrets);
    this.verbose = verbose;
    this.log = (msg) => this.verbose ? console.log(msg) : null;
  }

  /*
  * status: string with the final tweet text
  * mediaPath: path to .gif or .mp4 (optional)
  * */
  async tweet ({status, mediaPath}) {
    const postOptions = {
      status: status || '',
      media_ids: this._uploadMedia(mediaPath)
    };
    this.log(postOptions);
    this.log(`Tweeting "${postOptions.status}"`);
    if (postOptions.media_ids) this.log(` with media ${postOptions.media_ids}`);
    this.client.post('statuses/update', postOptions, (error) => {
      if (error) return this.log(error);
      this.log(`Tweeting "${postOptions.status}" ✓`);
    });
  }

  async _uploadMedia(mediaPath) {
    let mediaId = null;
    if (mediaPath) {
      const mediaUploader = new MediaUploader({
        client: this.client,
        mediaPath: mediaPath,
        verbose: this.verbose
      });
      mediaId = await mediaUploader.upload()
    }
    return mediaId
  }
}

module.exports = TweetBot;