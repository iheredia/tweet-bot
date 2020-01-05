const mockLoggerConstructor = jest.fn();
const mockLoggerLog = jest.fn();
const mockLogger = (class {
  constructor(...args) { mockLoggerConstructor(...args) }
  log(...args) { mockLoggerLog(...args) }
});
jest.mock('../logger', () => mockLogger);

const mockReadSync = jest.fn();
const mockStatSync = jest.fn();
const mockOpenSync = jest.fn();
jest.mock('fs', () => ({
  readSync: mockReadSync,
  statSync: mockStatSync,
  openSync: mockOpenSync,
}));

const mockClient = { postPromise: jest.fn() };

const MediaUploader = require('../media-uploader');

describe('Media uploader', () => {
  beforeEach(() => {
    mockLoggerConstructor.mockClear();
    mockLoggerLog.mockClear();
    mockReadSync.mockClear();
    mockStatSync.mockClear();
    mockOpenSync.mockClear();
    mockClient.postPromise.mockClear();
  });

  it('should upload file using the twitter client', async () => {
    mockStatSync.mockReturnValueOnce({ size: 1024 });
    mockReadSync.mockReturnValueOnce(10);
    mockClient.postPromise.mockReturnValueOnce({ media_id_string: 'gif-id-123' });

    const mediaUploader = new MediaUploader({ client: mockClient, mediaPath: '/small-file.gif' });
    await mediaUploader.upload();
    expect(mockClient.postPromise).toHaveBeenCalledTimes(3);
    expect(mockClient.postPromise).toHaveBeenCalledWith('media/upload', { command: 'INIT', total_bytes: 1024, media_type: 'image/gif', media_category: 'tweet_gif' });
    expect(mockClient.postPromise).toHaveBeenCalledWith('media/upload', { command: 'APPEND', media_id: 'gif-id-123', media: expect.any(Object), segment_index: 0 });
    expect(mockClient.postPromise).toHaveBeenCalledWith('media/upload', { command: 'FINALIZE', media_id: 'gif-id-123' });
  });

  it('should upload a big file with several chunks', async () => {
    mockStatSync.mockReturnValueOnce({ size: 5 * 1024 * 1024 });
    mockReadSync.mockReturnValueOnce(4 * 1024 * 1024).mockReturnValueOnce(10);
    mockClient.postPromise.mockReturnValueOnce({ media_id_string: 'mp4-id-345' });

    const mediaUploader = new MediaUploader({ client: mockClient, mediaPath: '/big-file.mp4' });
    await mediaUploader.upload();
    expect(mockClient.postPromise).toHaveBeenCalledTimes(4);
    expect(mockClient.postPromise).toHaveBeenCalledWith('media/upload', { command: 'INIT', total_bytes: 5 * 1024 * 1024, media_type: 'video/mp4', media_category: 'tweet_gif' });
    expect(mockClient.postPromise).toHaveBeenCalledWith('media/upload', { command: 'APPEND', media_id: 'mp4-id-345', media: expect.any(Object), segment_index: 0 });
    expect(mockClient.postPromise).toHaveBeenCalledWith('media/upload', { command: 'APPEND', media_id: 'mp4-id-345', media: expect.any(Object), segment_index: 1 });
    expect(mockClient.postPromise).toHaveBeenCalledWith('media/upload', { command: 'FINALIZE', media_id: 'mp4-id-345' });
  });
});