/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

define(function(require, exports, module) {

var util = require('gcli/util');

var canon = require('gcli/canon');
var domtemplate = require('gcli/ui/domtemplate');

var outputViewCss = require('text!gcli/ui/output_view.css');
var outputViewHtml = require('text!gcli/ui/output_terminal.html');


/**
 * A wrapper for a set of rows|command outputs.
 * Register with the canon to be notified when commands have output to be
 * displayed.
 * @param options Object containing user customization properties, including:
 * - commandOutputManager
 * @param components Object that links to other UI components. GCLI provided:
 * - element: Root element to populate
 * - requisition (optional): A click/double-click to an input row causes the
 *   command to be sent to the input/executed if we know the requisition use
 */
function OutputTerminal(options, components) {
  this.element = components.element;
  this.requisition = components.requisition;

  this.commandOutputManager = options.commandOutputManager ||
          canon.commandOutputManager;
  this.commandOutputManager.onOutput.add(this.onOutputCommandChange, this);

  var document = components.element.ownerDocument;
  if (outputViewCss != null) {
    this.style = util.importCss(outputViewCss, document);
  }

  this.template = util.toDom(document, outputViewHtml);
  this.templateOptions = { allowEval: true, stack: 'output_terminal.html' };
}

/**
 * Avoid memory leaks
 */
OutputTerminal.prototype.destroy = function() {
  if (this.style) {
    this.style.parentNode.removeChild(this.style);
    delete this.style;
  }

  delete this.element;
  delete this.template;
};

/**
 * Monitor for new command executions
 */
OutputTerminal.prototype.onOutputCommandChange = function(ev) {
  if (!ev.output.view) {
    ev.output.view = new OutputView(ev.output, this);
  }
  ev.output.view.onChange(ev);
};

/**
 * Display likes to be able to control the height of its children
 */
OutputTerminal.prototype.setHeight = function(height) {
  this.element.style.height = height + 'px';
};

exports.OutputTerminal = OutputTerminal;


/**
 * Adds a row to the CLI output display
 */
function OutputView(outputData, outputTerminal) {
  this.outputData = outputData;
  this.outputTerminal = outputTerminal;

  this.url = util.createUrlLookup(module);

  // Elements attached to this by template().
  this.elems = {
    rowin: null,
    rowout: null,
    hide: null,
    show: null,
    duration: null,
    throb: null,
    prompt: null
  };

  var template = this.outputTerminal.template.cloneNode(true);
  domtemplate.template(template, this, this.outputTerminal.templateOptions);

  this.outputTerminal.element.appendChild(this.elems.rowin);
  this.outputTerminal.element.appendChild(this.elems.rowout);
}

/**
 * Only display a prompt if there is a command, otherwise, leave blank
 */
Object.defineProperty(OutputView.prototype, 'prompt', {
  get: function() {
    return this.outputData.canonical ? '\u00bb' : '';
  },
  enumerable: true
});

/**
 * A single click on an invocation line in the console copies the command
 * to the command line
 */
OutputView.prototype.copyToInput = function() {
  if (this.outputTerminal.requisition) {
    this.outputTerminal.requisition.update(this.outputData.typed);
  }
};

/**
 * A double click on an invocation line in the console executes the command
 */
OutputView.prototype.execute = function(ev) {
  if (this.outputTerminal.requisition) {
    this.outputTerminal.requisition.exec({ typed: this.outputData.typed });
  }
};

OutputView.prototype.hideOutput = function(ev) {
  this.elems.rowout.style.display = 'none';
  this.elems.hide.classList.add('cmd_hidden');
  this.elems.show.classList.remove('cmd_hidden');

  ev.stopPropagation();
};

OutputView.prototype.showOutput = function(ev) {
  this.elems.rowout.style.display = 'block';
  this.elems.hide.classList.remove('cmd_hidden');
  this.elems.show.classList.add('cmd_hidden');

  ev.stopPropagation();
};

OutputView.prototype.remove = function(ev) {
  this.outputTerminal.element.removeChild(this.elems.rowin);
  this.outputTerminal.element.removeChild(this.elems.rowout);

  ev.stopPropagation();
};

OutputView.prototype.onChange = function(ev) {
  var document = this.elems.rowout.ownerDocument;
  var duration = this.outputData.duration != null ?
          'completed in ' + (this.outputData.duration / 1000) + ' sec ' :
          '';
  duration = document.createTextNode(duration);
  this.elems.duration.appendChild(duration);

  if (this.outputData.completed) {
    this.elems.prompt.classList.add('gcli-row-complete');
  }
  if (this.outputData.error) {
    this.elems.prompt.classList.add('gcli-row-error');
  }

  util.clearElement(this.elems.rowout);

  var node;
  var output = this.outputData.output;
  if (output != null) {
    var isElement = typeof HTMLElement === 'object' ?
        output instanceof HTMLElement :
        typeof output === 'object' && output.nodeType === 1 &&
            typeof output.nodeName === 'string';

    if (isElement) {
      this.elems.rowout.appendChild(output);
    }
    else {
      var returnType = this.outputData.command.returnType;
      var nodeName = (returnType === 'terminal') ? 'pre' : 'p';

      node = util.createElement(document, nodeName);
      util.setContents(node, output.toString());
      this.elems.rowout.appendChild(node);
    }
  }

  // We need to see the output of the latest command entered
  // Certain browsers have a bug such that scrollHeight is too small
  // when content does not fill the client area of the element
  var scrollHeight = Math.max(this.outputTerminal.element.scrollHeight,
      this.outputTerminal.element.clientHeight);
  this.outputTerminal.element.scrollTop =
      scrollHeight - this.outputTerminal.element.clientHeight;

  this.elems.throb.style.display = this.outputData.completed ? 'none' : 'block';
};

exports.OutputView = OutputView;


});