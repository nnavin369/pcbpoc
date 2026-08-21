'use strict';

const { CucumberJSAllureFormatter, AllureRuntime } = require('allure-cucumberjs');

class AllureReporter extends CucumberJSAllureFormatter {
  constructor(options) {
    super(
      options,
      new AllureRuntime({ resultsDir: './allure-results' }),
      {}
    );
  }
}

module.exports = AllureReporter;
