class Logger {
  /**
   * Create a Logger instance
   *
   * @param {object} config - Configuration for the logger instance
   * @param {boolean} config.verbose - Whether calls to the log method should print to stdout or not
   */
  constructor({ verbose }) {
    this.verbose = verbose
  }

  /**
   * Prints message to stdout (or skips it if the instance was created with verbose=false)
   *
   * @param {string} msg - Message to log to stdout
   */
  log(msg) {
    if (this.verbose) {
      console.log(msg)
    }
  }
}

module.exports = Logger;