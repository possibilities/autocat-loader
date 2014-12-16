var falafel = require('falafel');
var _  = require('lodash');
var fs = require('fs');

var path = require('path');


//Regex to figure out if anything "Reacty" is in the module
//TODO:  Use less stupid way of determining this
var REACT_CLASS_RE = /\React.createClass/;




//TEST CODE

/*
var ExternalComponent = require('./external-component');


var MyComponent = React.createClass({
  propTypes: {
    myProp: React.PropTypes.arrayOf([React.PropTypes.string])
  }
});

var MyOtherComponent = React.createClass({
  propTypes: {
    myOtherProp: React.PropTypes.string
  },
  render: function () {
    return React.createElement(ExternalComponent, {someProp: ""});
  }
});

module.exports = MyOtherComponent;
*/




/*CONSOLE DUMP  * /

 */
/*


 falafel(source, function (node) {



 if(node.type === 'VariableDeclarator'  &&
 node.init.type === 'CallExpression' &&
 node.init.callee.type === 'MemberExpression' &&
 node.init.callee.property.name === 'createClass' ){


 //Node for traversing React.createClass() component definition
 // var innerNode = node.init.arguments[0];




 var pp = falafel({ast: node}, function(innerNode){

 if (innerNode.type === 'CallExpression' &&
 innerNode.callee.type === 'MemberExpression' &&
 innerNode.callee.property.name === 'arrayOf') {
 innerNode.update("[" + innerNode.arguments[0].source() + "]");
 }

 if (innerNode.type === 'CallExpression' &&
 innerNode.callee.type === 'MemberExpression' &&
 innerNode.callee.property.name === 'oneOf') {
 innerNode.update("{type: 'enum', enumValues: " + innerNode.arguments[0].source() + "}");
 }

 if (innerNode.type === 'CallExpression' &&
 innerNode.callee.property.name === 'shape') {
 innerNode.update(innerNode.arguments[0].source());
 }


 if (innerNode.type === 'MemberExpression' &&
 innerNode.object.type === 'MemberExpression' &&
 (innerNode.property.name === 'string' ||
 innerNode.property.name === 'number' ||
 innerNode.property.name === 'bool' ||
 innerNode.property.name === 'object' ||
 innerNode.property.name === 'func')) {

 innerNode.update("{type: '" + innerNode.property.name + "'}");

 }
 })

 // console.log("{componentName:'" + node.id.name + "'," + "propsSchema: " + pp );



 }

 })


 */







//Transform arrayOf

/*
falafel(source, function (node) {
  if (node.type === 'CallExpression' && node.callee.property.name === 'arrayOf') {
    //console.log(node.source());
    node.update("[" + node.arguments[0].source() + "]");
  }
});


//Transform oneOf

falafel(source, function (node) {
  if (node.type === 'CallExpression' && node.callee.property.name === 'oneOf') {
    node.update("{type: 'enum', enumValues: " + node.arguments[0].source() + "}");
  }
})



//Transform shape

falafel(source, function (node) {
  if (node.type === 'CallExpression' && node.callee.property.name === 'shape') {
    //console.log(node.source());
    node.update(node.arguments[0].source());
  }
});


//Transform primitive types

falafel(source, function (node) {

  if (node.type === 'MemberExpression' &&
      node.object.type === 'MemberExpression' &&
        (node.property.name === 'string' ||
         node.property.name === 'number' ||
         node.property.name === 'bool' ||
         node.property.name === 'object' ||
         node.property.name === 'func'
        )) {

      node.update("{type: '" + node.property.name + "'}");

  }
})
*/



function getExportedComponentName(source) {

  var name = "";

  falafel(source, function (node) {
    if (node.type === "AssignmentExpression" &&
      node.left.type === "MemberExpression" &&
      node.left.object.type === "Identifier" &&
      node.left.object.name === 'module' &&
      node.left.property.type === "Identifier" &&
      node.left.property.name === 'exports' &&
      node.right.type == 'Identifier') {

      name = node.right.name;

    }
  });

  return name;

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
  return (node.type === 'VariableDeclarator' &&
  node.init &&
  node.init.type === 'CallExpression' &&
  node.init.callee.type === 'MemberExpression' &&
  node.init.callee.property.name === 'createClass');
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




/**
 * Transforms the source file into a representation that can be used at runtime by AutoCat
 * @param source
 * @returns {*}
 */

function tranformFile(source){


  var parsedComponentSchemaArray = [];

  var allRequireIdentifiers =[];

  falafel(source, function (node) {
    if(isRequireDeclaration(node)){
        allRequireIdentifiers.push(node.id.name);
    }
    if(isComponentDeclaration(node)){
        var subtreeAST = falafel(node.source(), function(innerNode){
          if (isPropTypeFunction(innerNode, 'arrayOf')) {
            innerNode.update("[" + innerNode.arguments[0].source() + "]");
          }
          if (isPropTypeFunction(innerNode, 'oneOf')) {
            innerNode.update("{type: 'enum', enumValues: " + innerNode.arguments[0].source() + "}");
          }
          if (isPropTypeFunction(innerNode, 'shape')) {
            innerNode.update(innerNode.arguments[0].source());
          }
          if (isPropTypePrimitiveType(innerNode)) {
            innerNode.update("{type: '" + innerNode.property.name + "'}");
          }
        }).ast;





      var componentPropTypesNode = _.find(subtreeAST.body[0].expression.right.arguments[0].properties, function(n) {return n.key.name === 'propTypes'; } );

      console.log("WILL IT PARSE? ",  "{'propsSchema': " + (componentPropTypesNode ? componentPropTypesNode.value.source() : "null") + "}"   );


      parsedComponentSchemaArray.push({componentName: node.id.name, propsSchema: JSON.parse((componentPropTypesNode ? componentPropTypesNode.value.source() : "null")) });


     // console.log("{componentName:'" + node.id.name + "'," + "propsSchema: " + (componentPropTypesNode ? componentPropTypesNode.value.source() : "null") + "}" );
    }
  });


  return parsedComponentSchemaArray;

 // return parsedPropsArray;
}



//if (node.type === 'Property' && node.key.name === 'propTypes') {


/*

 parsedPropsArray = _(node.parent.properties).filter(function (p) {
 return p.type == "Property" && p.key.name == "propTypes"
 }).map(function (n) {
 // console.log(self.request);
 return _.map(n.value.properties, function (e) {
 var ptString = e.value.source();
 var splitPTString = ptString.split('.');
 var isRequired = splitPTString[splitPTString.length - 1] === "isRequired";
 var type = isRequired ? splitPTString[splitPTString.length - 2] : splitPTString[splitPTString.length - 1];
 return {name: e.key.name, type: type, isRequired: isRequired };
 });
 }).flatten().value();
 }

 */

//});



var componentTemplateFunc = _.template(fs.readFileSync(require.resolve('./component.template'), 'utf8'));




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


/*
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
*/
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



      console.log(injectedSource);

      return injectedSource;
    }

  else{

      //Ignore modules without React top level api calls
      if (!content.match(REACT_CLASS_RE)) {
        return content;
      }



      //var exportsName = getExportedComponentName(source);

      //var transformedProps ;

      console.log("TRANSFORMED: ", filename);

      console.log(tranformFile(content));



      /*
      var transformedSource = falafel(content, function (node) {
        if (node.type === "AssignmentExpression" &&
            node.left.type === "MemberExpression" &&
            node.left.object.type === "Identifier" &&
            node.left.object.name === 'module' &&
            node.left.property.type === "Identifier" &&
            node.left.property.name === 'exports' &&
            node.right.type == 'Identifier')
            {

              var parsedPropArr = parseProps(content) || [];
              var transformedNode = componentTemplateFunc(
                {
                  componentName: node.right.name,
                  propsDescriptor: JSON.stringify(parsedPropArr),
                  fileName: filename,
                  fullPath: resourcePath,
                  exportNodeSource: node.source()
                });

              node.update(transformedNode);
            }
      });

      */


     return content;
    //  return "" + transformedSource;
    }
  }

  else{
    return content;
  }
}


