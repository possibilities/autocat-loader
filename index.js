var _  = require('lodash');
var fs = require('fs');
var path = require('path');
var loaderUtils = require('loader-utils');

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var escope = require('escope');


var transformModule = require('./transformers/module');
var transformEntryModule = require('./transformers/entry_module');



function getEntryArray(entry){
  if(_.isString(entry)){
    return [entry];
  }
  else if (_.isArray(entry)){
    return _.filter(entry, function(e){ return e.indexOf("webpack") === -1 });
  }
}


module.exports = function(source, map) {

  var query = loaderUtils.parseQuery(this.query);
  var importLoaders = parseInt(query.importLoaders, 10) || 0;
  var resourcePath = this.resourcePath;
  var filename = path.basename(resourcePath);
  var componentPath = this.context; //Make this a user provided parameter to determine the component dir

  var ignoredFiles = ['autocat_index.js'];

  if (this.cacheable) {
    this.cacheable();
  }

  if (/node_modules/.test(this.context) || _.contains(ignoredFiles, filename)) {
    return source;
  }

  //Parse out all potential app entry points
  var entryPaths = !_.isPlainObject(this.options.entry) ?
    getEntryArray(this.options.entry) :
    _(this.options.entry).map(function(val, key){ return getEntryArray(val); }).flatten().value();

  var isEntryModule = _.any(entryPaths, function(e){ return resourcePath.indexOf(e.replace(".", "")) !== -1 });


  if(isEntryModule){
    return transformEntryModule(source, componentPath);
  }
  //Only transform source files that define components
  else if (source.match(/\React.createClass/)){
    return transformModule(source, filename, resourcePath)
  }
  else{
    return source;
  }

}


