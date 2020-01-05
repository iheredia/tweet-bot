module.exports = {
  "env": {
    "es6": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:jsdoc/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "plugins": [
    "jest",
    "jsdoc"
  ],
};