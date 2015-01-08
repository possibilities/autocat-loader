var _  = require('lodash');
var fs = require('fs');
var path = require('path');
var loaderUtils = require('loader-utils');

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var escope = require('escope');


var transformModule = require('./transformers/module');
var entryModule = require('./transformers/entry_module');


//Regex to figure out if anything "Reacty" is in the module
//TODO:  Use less stupid way of determining this
var REACT_CLASS_RE = /\React.createClass/;




function getEntryArray(entry){
  if(_.isString(entry)){
    return [entry];
  }
  else if (_.isArray(entry)){
    return _.filter(entry, function(e){ return e.indexOf("webpack") === -1 });
  }
}


module.exports = function(source, map) {

  var self = this;
  var query = loaderUtils.parseQuery(this.query);
  var importLoaders = parseInt(query.importLoaders, 10) || 0;


 // console.log( this.loaders.map(function(e){return e.request}));

  if (this.cacheable) {
    this.cacheable();
  }

  var resourcePath = this.resourcePath,
    filename = path.basename(resourcePath);


  //Parse out all potential app entry points
  var entryPaths = !_.isPlainObject(this.options.entry) ?
    getEntryArray(this.options.entry) :
    _(this.options.entry).map(function(val, key){ return getEntryArray(val); }).flatten().value();



  var ignoredFiles = ['autocat_index.js', 'Glyphicon.jsx', 'OverlayTrigger.jsx'];


  if (!/node_modules/.test(this.context) && !_.contains(ignoredFiles, filename)){


    var curPath = this.resourcePath;

    //The entry module(s) we're going to hijack with AutoCat
    if( _.any(entryPaths, function(e){ return curPath.indexOf(e.replace(".", "")) !== -1 })){

      //This is the dir that gets traversed when building out the catalog
      //TODO:  Allow a path relative to the webpack config file to be passed in a loader config parameter
      //To override this behavior of traversing the directory that the entry module is located in
      var componentPath = this.context;


      return entryModule(source, componentPath);
    }

    else{

      //Ignore modules without React top level api calls
      if (!source.match(REACT_CLASS_RE)) {
        return source;
      }

      return transformModule(source, filename, resourcePath);
    }
  }

  else{
    return source;
  }
}


