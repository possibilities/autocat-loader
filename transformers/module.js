"use strict"

var _ = require('lodash');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');

var t = require('./util/node_types');
var transformPropTypeNodeIntoSchemaAST = require('./util/transform_proptypes');


module.exports = function(source, filename, fullpath) {

  var ast = esprima.parse(source);

  var componentName;
  var componentInstanceIdentifier;
  var childComponents;
  var usedProps;
  var propsSchema;


  var componentMetadataAST = [];


  estraverse.replace(ast, {
    enter:function(node, parent){

      if(t.isComponentDeclaration(node)){

        componentName =  {
          "type": "Literal",
          "value": node.declarations[0].id.name
        };

        componentInstanceIdentifier = {
          "type": "Identifier",
          "name": node.declarations[0].id.name
        };

        childComponents = [];
        usedProps = [];
      }

      if(t.isCreateCustomElementCall(node)){
        var cName = node.arguments[0].name;

        if(!_.contains(childComponents.map(function(node){ return node.value;}), cName)) {
          childComponents.push({
            "type": "Literal",
            "value": cName
          });
        }
      }

      if(t.isPropsMemberExpression(node)){
        var usedPropName = node.property.name;

        if(!_.contains(usedProps.map(function(node){ return node.value;}), usedPropName)) {
          usedProps.push({
            "type": "Literal",
            "value": usedPropName
          });
        }
      }

      if(t.isPropTypesProperty(node)){
        propsSchema = transformPropTypeNodeIntoSchemaAST(node);
      }

    },

    leave: function(node, parent){

      if(t.isComponentDeclaration(node)){

        var objExpression = {
          "type": "ObjectExpression",
          "properties": [
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "componentName"
              },
              "value": componentName,
              "kind": "init"
            },
            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "component"
              },
              "value": componentInstanceIdentifier,
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

      //Append the AST representation of the metadata gathered during traversal to the body of the current
      //AST so code can be generated to be used at runtime for generating the component catalog
      if(node.type === 'Program'){

        var chunk = esprima.parse(
          [
            "global.__AUTOCAT_COMPONENTS__ = global.__AUTOCAT_COMPONENTS__ || [];",
            "global.__AUTOCAT_COMPONENTS__ = global.__AUTOCAT_COMPONENTS__.concat('')"
          ].join("")
        );

        chunk.body[1].expression.right.arguments[0] = {type: "ArrayExpression", elements: componentMetadataAST };
        node.body.push(chunk);

      }
    }

  });

  return escodegen.generate(ast);

}