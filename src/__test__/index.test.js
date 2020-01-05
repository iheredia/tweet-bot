const mockMediaUploaderConstructor = jest.fn();
const mockMediaUploaderUpload = jest.fn();
const mockMediaUploader = (class {
  constructor(...args) { mockMediaUploaderConstructor(...args) }
  upload(...args) { return mockMediaUploaderUpload(...args) }
});
jest.mock('../media-uploader', () => mockMediaUploader);

const mockLoggerConstructor = jest.fn();
const mockLoggerLog = jest.fn();
const mockLogger = (class {
  constructor(...args) { mockLoggerConstructor(...args) }
  log(...args) { mockLoggerLog(...args) }
});
jest.mock('../logger', () => mockLogger);

const mockTwitterConstructor = jest.fn();
const mockTwitterPost = jest.fn();
const mockTwitterClass = (class {
  constructor(...args) { mockTwitterConstructor(...args) }
  post(url, params, callback) { callback(mockTwitterPost(url, params)) }
});
jest.mock('twitter', () => mockTwitterClass);
const TweetBot = require('..');

describe('Tweet bot class', () => {
  beforeEach(() => {
    mockMediaUploaderConstructor.mockClear();
    mockMediaUploaderUpload.mockClear();
    mockTwitterConstructor.mockClear();
    mockTwitterPost.mockClear();
    mockTwitterConstructor.mockClear;
    mockLoggerLog.mockClear();
  });

  it('should instantiate a Twitter client and logger', () => {
    const bot = new TweetBot({ secrets: 'some-secrets', verbose: true });
    expect(bot.client).toBeInstanceOf(mockTwitterClass);
    expect(mockTwitterConstructor).toHaveBeenCalledTimes(1);
    expect(mockTwitterConstructor).toHaveBeenCalledWith('some-secrets');
    expect(mockLoggerConstructor).toHaveBeenCalledTimes(1);
    expect(mockLoggerConstructor).toHaveBeenCalledWith({ verbose: true })
  });

  it('should resolve with no mediaId when mediaPath is undefined', async () => {
    const bot = new TweetBot({ secrets: 'some-secrets' });
    const mediaId = await bot._uploadMedia();
    expect(mediaId).toBeNull();
    expect(mockMediaUploaderConstructor).toHaveBeenCalledTimes(0);
    expect(mockMediaUploaderUpload).toHaveBeenCalledTimes(0);
  });

  it('should upload media using the MediaUploader', async () => {
    mockMediaUploaderUpload.mockReturnValueOnce('mocked-media-id');
    const bot = new TweetBot({ secrets: 'some-secrets' });
    const mediaId = await bot._uploadMedia('/path/to/some/file');
    expect(mediaId).toBe('mocked-media-id');
    expect(mockMediaUploaderConstructor).toHaveBeenCalledTimes(1);
    expect(mockMediaUploaderUpload).toHaveBeenCalledTimes(1);
  });

  it('should publish a text-only tweet', async () => {
    const bot = new TweetBot({ secrets: 'some-secrets' });
    await bot.tweet({ status: 'Hello twitter' });
    expect(mockTwitterPost).toHaveBeenCalledTimes(1);
    expect(mockTwitterPost).toHaveBeenCalledWith('statuses/update', { status: 'Hello twitter', media_ids: null });
    expect(mockLoggerLog).toHaveBeenCalledTimes(1);
    expect(mockLoggerLog).toHaveBeenCalledWith('Tweeting "Hello twitter"');
  });

  it('should publish a media-only tweet', async () => {
    mockMediaUploaderUpload.mockReturnValueOnce('media-id-123');
    const bot = new TweetBot({ secrets: 'some-secrets' });
    await bot.tweet({ mediaPath: '/path/to/some/file.gif' });
    expect(mockTwitterPost).toHaveBeenCalledTimes(1);
    expect(mockTwitterPost).toHaveBeenCalledWith('statuses/update', { status: '', media_ids: 'media-id-123' });
    expect(mockLoggerLog).toHaveBeenCalledTimes(1);
    expect(mockLoggerLog).toHaveBeenCalledWith('Tweeting with media /path/to/some/file.gif');
  });

  it('should publish a text-and-media tweet', async () => {
    mockMediaUploaderUpload.mockReturnValueOnce('media-id-456');
    const bot = new TweetBot({ secrets: 'some-secrets' });
    await bot.tweet({ status: 'Check this thing', mediaPath: '/path/to/some/other/file.gif' });
    expect(mockTwitterPost).toHaveBeenCalledTimes(1);
    expect(mockTwitterPost).toHaveBeenCalledWith('statuses/update', { status: 'Check this thing', media_ids: 'media-id-456' });
    expect(mockLoggerLog).toHaveBeenCalledTimes(1);
    expect(mockLoggerLog).toHaveBeenCalledWith('Tweeting "Check this thing" with media /path/to/some/other/file.gif');
  });

  it('should log errors from the twitter client', async () => {
    mockTwitterPost.mockReturnValueOnce('some-error');
    const bot = new TweetBot({ secrets: 'some-secrets' });
    let raisedError;
    try {
      await bot.tweet({ status: 'This should fail' });
    } catch (error) {
      raisedError = error;
    }
    expect(mockLoggerLog).toHaveBeenCalledTimes(2);
    expect(mockLoggerLog).toHaveBeenCalledWith('Tweeting "This should fail"');
    expect(mockLoggerLog).toHaveBeenCalledWith('some-error');
    expect(raisedError).toBe('some-error');
  });
});