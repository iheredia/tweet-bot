const util = require('util');
const Twitter = require('twitter');
const MediaUploader = require('./media-uploader');
const Logger = require('./logger');

class TweetBot {

  /**
   * Secrets for the Twitter API client
   * Can be obtain at https://developer.twitter.com/en/apps
   *
   * @typedef Secrets
   * @property {string} consumer_key - Consumer key token
   * @property {string} consumer_secret - Consumer secret token
   * @property {string} access_token_key - Access token key
   * @property {string} access_token_secret - Access token secret
   */

  /**
   * Creates a TweetBot instance
   *
   * @param {object} params - Object with params for the bot
   * @param {Secrets} [params.secrets] - Objects with secrets for the Twitter API client
   * @param {boolean} [params.verbose] - Verbose flag for the Logger instance
   */
  constructor ({secrets, verbose}) {
    this.client = new Twitter(secrets);
    this.client.postPromise = util.promisify(this.client.post);
    this.verbose = verbose;
    this.logger = new Logger({ verbose });
  }

  /**
   * Creates a tweet with either a message, a media (.gif or .mp4) or both
   *
   * @param {object} params - Object with params for the tweet
   * @param {string} [params.status] - Text for the tweet
   * @param {string} [params.mediaPath] - Path to the file to be used in the tweet (.gif or .mp4)
   * @returns {Promise} - Promise that resolves when the tweet is created
   */
  async tweet ({status, mediaPath}) {
    const postOptions = {
      status: status || '',
      media_ids: await this._uploadMedia(mediaPath)
    };
    this.logger.log(`Tweeting${ postOptions.status ? ` "${postOptions.status}"` : ''}${ postOptions.media_ids ? ` with media ${mediaPath}` : ''}`);
    try {
      await this.client.postPromise('statuses/update', postOptions);
    } catch (error) {
      this.logger.log(error);
      throw error;
    }
  }

  /**
   * Uploads a .gif or .mp4 file to later be used in a tweet
   *
   * @param {string} mediaPath - Path to the .gif or .mp4 file
   * @returns {Promise<number>} - Id of the uploaded file
   */
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