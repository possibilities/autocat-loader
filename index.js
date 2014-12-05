var falafel = require('falafel');
var _  = require('lodash');


var detective = require('detective');
var fs = require('fs');

var path = require('path');


var reactTools = require('react-tools');



//Regex to figure out if anything "Reacty" is in the module
//TODO:  Use less stupid way of determining this
var REACT_CLASS_RE = /\React/;


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
var autoCatIndexSource = reactTools.transform(fs.readFileSync(require.resolve('./autocat_index.js'), 'utf8'), {harmony: true});


module.exports = function(content, map) {

  if (this.cacheable) {
    this.cacheable();
  }


  var resourcePath = this.resourcePath,
    filename = path.basename(resourcePath);


  var self = this;

  var ignoredModules = ["app.js", "_tabcontainer.js", "mapping_step.js"];

 // var ignoredModules = [];

  //var includedModules = ["file_icon.js"]


  if (!/node_modules/.test(this.context) && !_.contains(ignoredModules, filename)){



    var curPath = this.request.split('!')[this.request.split('!').length - 1];
    var entryPath =  self.options.entry.main[2].replace(".", "");

      //self.options.entry[1].replace(".", "");



    if( curPath.indexOf(entryPath) != -1){
      //return indexTemplateFunc({source: content});
      console.log("IN THE INDEX", entryPath)
      return content + " \n\n\n\n" + autoCatIndexSource;

    }


    else{

      //Ignore modules without React components


      if (!content.match(REACT_CLASS_RE)) {
        console.log("IGNORED ",this.request.split('!')[this.request.split('!').length - 1]);
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
              var transformedNode = componentTemplateFunc({componentName: node.right.name, propsDescriptor: JSON.stringify(parsedPropArr), exportNodeSource: node.source()});

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


