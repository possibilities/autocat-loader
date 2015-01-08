"use strict"

var t = exports;


//Matches: var SomeModule = require('./some_module')
t.isRequireDeclaration = function(node) {

  return (node.type === 'VariableDeclarator' &&
  node.init &&
  node.init.type === 'CallExpression' &&
  node.init.callee.name === 'require');
}

t.isExportIdentifier = function(node) {

  return (node.type === 'AssignmentExpression' &&
  node.left.type === 'MemberExpression' &&
  node.left.property.name === 'exports'&&
  node.right.type === 'Identifier')
}

//Matches: var SomeComponent = React.createClass({})
t.isComponentDeclaration = function(node) {
  return (
  node.type === 'VariableDeclaration' &&
  node.declarations[0] &&
  node.declarations[0].type === 'VariableDeclarator' &&
  node.declarations[0].init &&
  node.declarations[0].init.type === 'CallExpression' &&
  node.declarations[0].init.callee.type === 'MemberExpression' &&
  node.declarations[0].init.callee.property.name === 'createClass');
}

//Matches nodes for React.PropTypes.arrayOf(), React.PropTypes.shape() etc...
t.isPropTypeFunction = function(node, funcName) {
  return (node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.property.name === funcName);
}

//Matches nodes for React.PropTypes.{$type} | where $type = string || number || bool etc...
t.isPropTypePrimitiveType = function(node){
  return (node.type === 'MemberExpression' &&
  node.object.type === 'MemberExpression' &&
  (node.property.name === 'string' ||
  node.property.name === 'number' ||
  node.property.name === 'bool' ||
  node.property.name === 'object' ||
  node.property.name === 'func' ||
  node.property.name === 'array' ||
  node.property.name === 'node'||
  node.property.name === 'any'));

}

//Matches nodes for React.PropTypes.{$type}.isRequired | where $type = string || number || bool etc...
t.isPropPrimitiveTypeIsRequiredNode = function(node){
  return (node.type === 'MemberExpression' &&
  node.object.type === 'MemberExpression' &&
  node.object.object &&
  node.object.object.type === 'MemberExpression' &&
  (node.object.property.name === 'string' ||
  node.object.property.name === 'number' ||
  node.object.property.name === 'bool' ||
  node.object.property.name === 'object' ||
  node.object.property.name === 'func' ||
  node.object.property.name === 'array' ||
  node.object.property.name === 'node' ||
  node.object.property.name === 'any'));
}

//Matches on React.createElement(SomeCustomELement, ......) calls where the passed in element is an identifier (as opposed to "div" "ul" etc)
t.isCreateCustomElementCall = function(node){

  return (node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.property.name === 'createElement' &&
  node.arguments[0].type === 'Identifier')

}

t.isPropsMemberExpression = function(node){

  return (node.type === 'MemberExpression' &&
  node.object.type === 'MemberExpression' &&
  node.object.property.name === 'props')

}

t.isPropTypesProperty = function(node){
  return (node.type === 'Property' &&
  node.key.name === 'propTypes')
}