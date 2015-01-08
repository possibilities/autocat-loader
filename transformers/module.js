"use strict"

var _ = require('lodash');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');




//Matches: module.exports = SomeIdentifier
function isExportIdentifier(node) {

  return (node.type === 'AssignmentExpression' &&
  node.left.type === 'MemberExpression' &&
  node.left.property.name === 'exports'&&
  node.right.type === 'Identifier')
}


//Matches: var SomeModule = require('./some_module')
function isRequireDeclaration(node) {

  return (node.type === 'VariableDeclarator' &&
  node.init &&
  node.init.type === 'CallExpression' &&
  node.init.callee.name === 'require');
}


//Matches: var SomeComponent = React.createClass({})
function isComponentDeclaration(node) {
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
function isPropTypeFunction(node, funcName) {
  return (node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.property.name === funcName);
}

//Matches nodes for React.PropTypes.{$type} | where $type = string || number || bool etc...
function isPropTypePrimitiveType(node){
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
function isPropPrimitiveTypeIsRequiredNode(node){
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
function isCreateCustomElementCall(node){

  return (node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.property.name === 'createElement' &&
  node.arguments[0].type === 'Identifier')

}



function isPropsMemberExpression(node){

  return (node.type === 'MemberExpression' &&
  node.object.type === 'MemberExpression' &&
  node.object.property.name === 'props')

}




function isPropTypesProperty(node){
  return (node.type === 'Property' &&
  node.key.name === 'propTypes')
}




function transformPropTypeNodeIntoSchemaAST(proptype_node){

  var clonedNode = _.cloneDeep(proptype_node);


  estraverse.replace(clonedNode, {
    enter:function(node, parent){

      //***** AST rewrite functions ******

      if (isPropTypeFunction(node, 'arrayOf')) {
        return {
          "type": "ArrayExpression",
          "elements": [ node.arguments[0]]
        }
      }

      if( isPropTypeFunction(node, 'oneOf')) {
        return {
          "type": "ObjectExpression",
          "properties": [
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "type"
              },
              "value": {
                "type": "Literal",
                "value": "enum"
              },
              "kind": "init"
            },
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "enumValues"
              },
              "value": node.arguments[0],
              "kind": "init"
            }
          ]
        };
      }

      if (isPropTypeFunction(node, 'shape')) {
        return node.arguments[0];
      }


      //Match on propType nodes with .isRequired
      if(isPropPrimitiveTypeIsRequiredNode(node)){
        return {
          "type": "ObjectExpression",
          "properties": [
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "type"
              },
              "value": {
                "type": "Literal",
                "value": node.object.property.name
              },
              "kind": "init"
            },

            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "required"
              },
              "value": {
                "type": "Literal",
                "value": true
              },
              "kind": "init"
            }
          ]
        };
      }


      //Match on propType nodes without .isRequired
      if (isPropTypePrimitiveType(node)) {
        return {
          "type": "ObjectExpression",
          "properties": [
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "type"
              },
              "value": {
                "type": "Literal",
                "value": node.property.name
              },
              "kind": "init"
            }
          ]
        };
      }
    }
  });


  return clonedNode;

}






/**
 * Builds up an array of component metadata objects for later use at runtime
 * @param {String} source
 * @returns {Array}
 */
module.exports = function(source, filename, fullpath) {

  var ast = esprima.parse(source);

  var componentName = "";
  var childComponents;
  var usedProps;
  var propsSchema;


  var componentMetadataAST = [];


  estraverse.replace(ast, {
    enter:function(node, parent){

      if(isComponentDeclaration(node)){

        componentName =  {
          "type": "Literal",
          "value": node.declarations[0].id.name
        };

        childComponents = [];
        usedProps = [];
      }

      if(isCreateCustomElementCall(node)){
        var cName = node.arguments[0].name;

        if(!_.contains(childComponents, cName)) {
          childComponents.push({
            "type": "Literal",
            "value": cName
          });
        }
      }

      if(isPropsMemberExpression(node)){
        var usedPropName = node.property.name;

        if(!_.contains(usedProps, usedPropName)) {
          usedProps.push({
            "type": "Literal",
            "value": usedPropName
          });
        }
      }

      if(isPropTypesProperty(node)){
        propsSchema = transformPropTypeNodeIntoSchemaAST(node);
      }

    },

    leave: function(node, parent){

      if(isComponentDeclaration(node)){

        var objExpression = {
          "type": "ObjectExpression",
          "properties": [
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "component"
              },
              "value": componentName,
              "kind": "init"
            },
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "props"
              },
              "value": propsSchema ? propsSchema.value : { "type": "ObjectExpression", "properties": [] },
              "kind": "init"
            },

            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "usedProps"
              },
              "value": {
                "type": "ArrayExpression",
                "elements": usedProps
              },

              "kind": "init"
            },
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "childComponents"
              },
              "value": {
                "type": "ArrayExpression",
                "elements": childComponents
              },
              "kind": "init"
            },

            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "fileName"
              },
              "value": {
                "type": "Literal",
                "value": filename
              },
              "kind": "init"
            },
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "fullPath"
              },
              "value": {
                "type": "Literal",
                "value": fullpath
              },
              "kind": "init"
            }
          ]
        };

        componentMetadataAST.push(objExpression);
      }



      if(node.type === 'Program'){

        var chunk = esprima.parse(
          [
            "global.__AUTOCAT_COMPONENTS__ = global.__AUTOCAT_COMPONENTS__ || [];",
            "global.__AUTOCAT_COMPONENTS__ = global.__AUTOCAT_COMPONENTS__.concat('')"
          ].join("")
        );

        chunk.body[1].expression.right.arguments[0] = {type: "ArrayExpression", elements:componentMetadataAST };

        node.body.push(chunk);


        //return node;

      }
    }


  });

  return escodegen.generate(ast);

}