"use strict"

var _ = require('lodash');
var esprima = require('esprima');
var escodegen = require('escodegen');
var estraverse = require('estraverse');


module.exports = function (source, componentPath) {

  var ast = esprima.parse(source);

  var chunk = esprima.parse(
    [
      "var React = require('react');",
      "var ctx = require.context('" + componentPath + "', true, /^(?!.*__tests__).*(\.js)/);",
      "ctx.keys().forEach(function(key){",
      "console.log(key);",
      "ctx(key);",
      "});",
      "var AutoCatApp = require('autocat-loader/runtime_components/index.js');",
      "React.render(React.createElement(AutoCatApp, null), document.body);"
    ].join(""));

  ast.body.push(chunk);

  return escodegen.generate(ast);

}



