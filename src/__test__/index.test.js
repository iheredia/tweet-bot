const mockMediaUploaderConstructor = jest.fn();
const mockMediaUploaderUpload = jest.fn();
const mockMediaUploader = (class {
  constructor(...args) { mockMediaUploaderConstructor(...args) }
  upload(...args) { return mockMediaUploaderUpload(...args) }
});
jest.mock('../media-uploader', () => mockMediaUploader);

const mockTwitterConstructor = jest.fn();
const mockTwitterClass = (class {
  constructor(...args) { mockTwitterConstructor(...args) }
});
jest.mock('twitter', () => mockTwitterClass);
const TweetBot = require('..');

describe('Tweet bot class', () => {
  beforeEach(() => {
    mockMediaUploaderConstructor.mockClear();
    mockMediaUploaderUpload.mockClear();
    mockTwitterConstructor.mockClear();
  });

  it('should instantiate a Twitter client', () => {
    const bot = new TweetBot({ secrets: 'some-secrets' });
    expect(bot.client).toBeInstanceOf(mockTwitterClass);
    expect(mockTwitterConstructor).toHaveBeenCalledTimes(1);
    expect(mockTwitterConstructor).toHaveBeenCalledWith('some-secrets')
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
  })
});