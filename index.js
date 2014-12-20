var _  = require('lodash');
var fs = require('fs');
var path = require('path');

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');


//Regex to figure out if anything "Reacty" is in the module
//TODO:  Use less stupid way of determining this
var REACT_CLASS_RE = /\React.createClass/;



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
  node.property.name === 'array'));

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
  node.object.property.name === 'array'));

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


function isRenderMethodProperty(node){
  return (node.type === 'Property' &&
  node.key.name === 'render')
}




/**
 * Transforms the source file into a representation that can be used at runtime by AutoCat
 * @param source
 * @returns {*}
 */


function tranformFile(source){

  //[{componentName: 'MyComponent', childComponents: [], ...]
  var componentModels = [];

  var requireIdentifiers = [];
  var exportedIdentifier;


  var currentComponentModel;


  var ast = esprima.parse(source);


  estraverse.replace(ast, {
    enter:function(node, parent){

      //**** AST Scan/collect functions ******


      //Going to traverse the component declaration subtree --
      //create a new object to store the owned child components that will get traversed
      if(isComponentDeclaration(node)){

        currentComponentModel = {
          name: node.declarations[0].id.name,
          childComponents: [],
          usedProps: [],
          propSchema: {}
        };

        componentModels.push(currentComponentModel);
      }

      if(isCreateCustomElementCall(node)){
        var cName = node.arguments[0].name;

        if(currentComponentModel && !_.contains(currentComponentModel.childComponents, cName)) {
          currentComponentModel.childComponents.push(cName);
        }
      }

      if(isPropsMemberExpression(node)){
        var usedPropName = node.property.name;

        if(!_.contains(currentComponentModel.usedProps, usedPropName)) {
          currentComponentModel.usedProps.push(usedPropName);
        }
      }


      if(isRequireDeclaration(node)){
        requireIdentifiers.push(node.id.name);
      };

      if(isExportIdentifier(node)){
        exportedIdentifier = node.right.name;
      }


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
                "name": "type",
              },
              "value": {
                "type": "Literal",
                "value": "enum"
              },
              "kind": "init",
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
                "name": "type",
              },
              "value": {
                "type": "Literal",
                "value": node.object.property.name,
              },
              "kind": "init"
            },

            {
              "type": "Property",
              "key": {
                "type": "Identifier",
                "name": "required",
              },
              "value": {
                "type": "Literal",
                "value": true,
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
                "name": "type",
              },
              "value": {
                "type": "Literal",
                "value": node.property.name,
              },
              "kind": "init"
            }
          ]
        };
      }
    },

    leave: function(node, parent){
      //Generate code for the transformed propType literal and tack it onto the current component model context
      if(isPropTypesProperty(node)){
        var parsedTransformedPropTypes =  eval("(" + escodegen.generate(node.value) + ")");
        currentComponentModel.propSchema = parsedTransformedPropTypes;
      }
    }
  });

  return componentModels;
}


function getEntryArray(entry){
  if(_.isString(entry)){
    return [entry];
  }
  else if (_.isArray(entry)){
    return _.filter(entry, function(e){ return e.indexOf("webpack") === -1 });
  }
}


module.exports = function(content, map) {

  var self = this;

  if (this.cacheable) {
    this.cacheable();
  }

  var resourcePath = this.resourcePath,
    filename = path.basename(resourcePath);


  //Parse out all potential app entry points
  var entryPaths = !_.isPlainObject(this.options.entry) ?
    getEntryArray(this.options.entry) :
    _(this.options.entry).map(function(val, key){ return getEntryArray(val); }).flatten().value();



  if (!/node_modules/.test(this.context) && filename !== 'autocat_index.js'){


    var curPath = this.resourcePath;

    //The entry module(s) we're going to hijack with AutoCat
    if( _.any(entryPaths, function(e){ return curPath.indexOf(e.replace(".", "")) !== -1 })){

      //This is the dir that gets traversed when building out the catalog
      //TODO:  Allow a path relative to the webpack config file to be passed in a loader config parameter
      //To override this behavior of traversing the directory that the entry module is located in
      var componentPath = this.context;

      var nodePath = '/Users/opengov/WebstormProjects/DataManager/node_modules/';
      var modulePath = nodePath + 'autocat-loader';



      var injectedSource = [
        "require('"+ require.resolve('./autocat.css') + "');",
        "var React = require('react');",
        "var ctx = require.context('" + componentPath + "', true, /^(?!.*__tests__).*(\.js)/);",
        "ctx.keys().forEach(function(key){",
        "console.log(key);",
        "ctx(key);",
        "});",
        "var AutoCatApp = require('"+ require.resolve('./autocat_index.js') +"')(React);",
        "if (typeof window !== 'undefined') { React.render(React.createElement(AutoCatApp, null), document.body); }"
      ].join(" ");


/*
       var injectedSource = [
       "require('"+ modulePath + "/autocat.css" + "');",
       "var React = require('react');",
       "var ctx = require.context('" + componentPath + "', true, /^(?!.*__tests__).*(\.js)/);",
       "ctx.keys().forEach(function(key){",
       "console.log(key);",
       "ctx(key);",
       "});",
       "var AutoCatApp = require('"+ modulePath + "/autocat_index.js" +"')(React);",
       "if (typeof window !== 'undefined') { React.render(React.createElement(AutoCatApp, null), document.body); }"
       ].join(" ");

*/


      console.log(injectedSource);


      return  "try {" + content + injectedSource + "} catch(ex){ console.log(ex);}";
    }

    else{

      //Ignore modules without React top level api calls
      if (!content.match(REACT_CLASS_RE)) {
        return content;
      }


      console.log("TRANSFORMED: ", filename);

      var componentModelArray = tranformFile(content);

      var appendScript = componentModelArray.map(function(c){
        return  "global.__AUTOCAT_COMPONENTS__ = global.__AUTOCAT_COMPONENTS__ || []; \n" +
          "global.__AUTOCAT_COMPONENTS__.push({ \n" +
          "  name: '"+ c.name + "', \n" +
          "  component: " + c.name + ", \n" +
          "  props: " + JSON.stringify(c.propSchema) +", \n" +
          "  usedProps: " + JSON.stringify(c.usedProps) +", \n" +
          "  childComponents: " + JSON.stringify(c.childComponents) + ", \n" +
          "  fileName: '"+filename+"', \n" +
          "  fullPath: '"+resourcePath+"' \n" +
          "});"}).join("\n");


      return content + appendScript;
    }
  }

  else{
    return content;
  }
}


