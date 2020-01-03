const mockTwitterConstructor = jest.fn();
const mockTwitterClass = (class {
  constructor(...args) {
    mockTwitterConstructor(...args);
  }
});
jest.mock('twitter', () => mockTwitterClass);
jest.mock('../media-uploader', () => {});
const TweetBot = require('..');

describe('Tweet bot class', () => {
  it('should instantiate a Twitter client', () => {
    const bot = new TweetBot({ secrets: 'some-secrets' });
    expect(bot.client).toBeInstanceOf(mockTwitterClass);
    expect(mockTwitterConstructor).toHaveBeenCalledTimes(1);
    expect(mockTwitterConstructor).toHaveBeenCalledWith('some-secrets')
  });
});