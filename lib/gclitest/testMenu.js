/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

define(function(require, exports, module) {


var test = require('test/assert');
var helpers = require('gclitest/helpers');
var mockCommands = require('gclitest/mockCommands');


exports.setup = function(options) {
  mockCommands.setup();
  helpers.setup(options);
};

exports.shutdown = function(options) {
  mockCommands.shutdown();
  helpers.shutdown(options);
};

exports.testOptions = function(options) {
  helpers.setInput('tslong');
  helpers.check({
    input:  'tslong',
    markup: 'VVVVVV',
    directTabText: '',
    arrowTabText: '',
    status: 'ERROR',
    emptyParameters: [ ' <msg>', ' [options]' ],
    args: {
      msg: { value: undefined, status: 'INCOMPLETE' },
      num: { value: undefined, status: 'VALID' },
      sel: { value: undefined, status: 'VALID' },
      bool: { value: undefined, status: 'VALID' },
      bool2: { value: undefined, status: 'VALID' },
      sel2: { value: undefined, status: 'VALID' },
      num2: { value: undefined, status: 'VALID' }
    }
  });
};


});
