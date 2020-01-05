class Logger {
  constructor({ verbose }) {
    this.verbose = verbose
  }

  log(msg) {
    if (this.verbose) {
      console.log(msg)
    }
  }
}

module.exports = Logger;