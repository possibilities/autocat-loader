"use strict"

var _ = require('lodash');

var estraverse = require('estraverse');
var t = require('./node_types');

/**
 * Converts a propTypes AST node into a JSON schema-like representation for easier use at runtime
 * @param proptype_node
 * @returns {ObjectExpression}
 */

module.exports = function(proptype_node){

  var clonedNode = _.cloneDeep(proptype_node);


  estraverse.replace(clonedNode, {
    enter:function(node, parent){

      //***** AST rewrite functions ******

      if (t.isPropTypeFunction(node, 'arrayOf')) {
        return {
          "type": "ArrayExpression",
          "elements": [ node.arguments[0]]
        }
      }

      if(t.isPropTypeFunction(node, 'oneOf')) {
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

      if (t.isPropTypeFunction(node, 'shape')) {
        return node.arguments[0];
      }


      //Match on propType nodes with .isRequired
      if(t.isPropPrimitiveTypeIsRequiredNode(node)){
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
      if (t.isPropTypePrimitiveType(node)) {
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