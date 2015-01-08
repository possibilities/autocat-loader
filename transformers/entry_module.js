"use strict"

var _ = require('lodash');
var esprima = require('esprima');
var escodegen = require('escodegen');
var estraverse = require('estraverse');


//React.render(<TopLevelComponent />)
function isTopLevelAPIRender(node) {
  return (node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.object.name === 'React' &&
  node.callee.property.name === 'render')
}


module.exports = function (source, componentPath) {

  var ast = esprima.parse(source);

  console.log(ast);

  estraverse.replace(ast, {
    enter: function (node, parent) {

      //Replace top level render with AutoCat render
      if (isTopLevelAPIRender(node)) {
        this.skip();
        return esprima.parse("React.render(React.createElement(AutoCatApp, null), document.body);");
      }
    },

    leave: function (node, parent) {

      if (node.type === 'Program') {

        var beforeChunk = esprima.parse(
          [
            "var React = require('react');",
            "var ctx = require.context('" + componentPath + "', true, /^(?!.*__tests__).*(\.js)/);",
            "ctx.keys().forEach(function(key){",
              "console.log(key);",
              "ctx(key);",
            "});",
            "var AutoCatApp = require('autocat-loader/runtime_components/index.js');"
          ].join(""));


        node.body.unshift(beforeChunk);

        return node;
      }
    }
  });

  return escodegen.generate(ast);

}



