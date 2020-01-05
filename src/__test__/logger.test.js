const Logger = require('../logger');
describe('Logger', () => {
  console.log = jest.fn();
  beforeEach(() => {
    console.log.mockClear();
  });

  it('should use console log when initialize with verbose=true', () => {
    const logger = new Logger({ verbose: true });
    logger.log('some-message');
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('some-message');
  });

  it('should do nothing when initialized with verbose=false', () => {
    const logger = new Logger({ verbose: false });
    logger.log('some-other-message');
    expect(console.log).toHaveBeenCalledTimes(0);
  });
});