var falafel = require('falafel');
var _  = require('lodash');
var fs = require('fs');

var path = require('path');


//Regex to figure out if anything "Reacty" is in the module
//TODO:  Use less stupid way of determining this
var REACT_CLASS_RE = /\React.createClass/;


function getComponentName(object) {
  if (object &&
    object.type === "AssignmentExpression" &&
    object.left.type === "MemberExpression" &&
    object.left.object.type === "Identifier" &&
    object.left.object.name === 'module' &&
    object.left.property.type === "Identifier" &&
    object.left.property.name === 'exports') {

    return object.right.name;

  }
}


/**
 *
 * @param source - Component sourcecode
 * @returns {Array}
 *  [{ name: 'className', type: 'ReactPropTypes.string' },
 *   { name: 'id', type: 'ReactPropTypes.string' },
 *   { name: 'placeholder', type: 'ReactPropTypes.string' },
 *   { name: 'onSave', type: 'ReactPropTypes.func.isRequired' },
 *   { name: 'value', type: 'ReactPropTypes.string' } ]
 */

function parseProps(source){

  var parsedPropsArray

  falafel(source, function (node) {
    if (node.type === 'Property' && node.key.name === 'propTypes') {

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
  });

  return parsedPropsArray;
}



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

      console.log(injectedSource);

      return injectedSource;
    }

  else{

      //Ignore modules without React top level api calls
      if (!content.match(REACT_CLASS_RE)) {
        return content;
      }


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

      return "" + transformedSource;
    }
  }

  else{
    return content;
  }
}


