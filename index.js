var falafel = require('falafel');
var _  = require('lodash');


var detective = require('detective');
var fs = require('fs');






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



module.exports = function(content) {


  if (this.cacheable) {
    this.cacheable();
  }



  var self = this;
  var output = content;


  if (!/node_modules/.test(this.context)){

   // console.log("CONTEXT: ", this.context);
   // console.log("REQUEST: ", this.request.split('!')[this.request.split('!').length - 1] );

    ///Users/opengov/WebstormProjects/DataManagerSandbox/app/js/index.js


    //npm ivar src = fs.readFileSync("/Users/opengov/WebstormProjects/DataManagerSandbox/app/js/index.js");
   // var requires = detective(content);




   // console.log("Require tree", Object.keys(this._compiler));


    //console.log("RESOLVED SYNC: ", this.resolveSync(this.context, self.options.entry.main[2] ));


 //   console.log("ENTRY: ", self.options.entry.main[2]);



    var curPath = this.request.split('!')[this.request.split('!').length - 1];
    var entryPath = self.options.entry.main[2].replace(".", "");

   // console.log(curPath, entryPath);

    if( curPath.indexOf(entryPath) != -1){

      console.log(curPath, entryPath);

     // output += "var AutoCatApp = React.createClass({displayName: 'AutoCatApp', render: function() {return React.createElement('div', null, __AUTOCAT_COMPONENTS__.map(function(Component){ return React.createElement(Component, null)}), ' '); }  });  React.render(React.createElement(AutoCatApp, {iconName: 'John', tooltipLabel: 'adsfadsf'}), document.body);";

      output += "var AutoCatApp = React.createClass({displayName: 'AutoCatApp', render: function() {return React.createElement('div', null, __AUTOCAT_COMPONENTS__.map(function(c){ return c.props }), ' ');  } });  React.render(React.createElement(AutoCatApp, {iconName: 'John', tooltipLabel: 'adsfadsf'}), document.body);";


    }


    else{

      output = falafel(content, function (node) {
        if (node.type === "AssignmentExpression" &&
            node.left.type === "MemberExpression" &&
            node.left.object.type === "Identifier" &&
            node.left.object.name === 'module' &&
            node.left.property.type === "Identifier" &&
            node.left.property.name === 'exports' &&
            node.right.type == 'Identifier')
            {
              console.log(node.source(), node.right.type);

              console.log(parseProps(content));


              node.update("global.__AUTOCAT_COMPONENTS__ = ( typeof __AUTOCAT_COMPONENTS__ != 'undefined' && __AUTOCAT_COMPONENTS__ instanceof Array ) ? __AUTOCAT_COMPONENTS__ : [];  global.__AUTOCAT_COMPONENTS__.push({name: '"+ node.right.name +"', component: "+node.right.name +", props: "+ JSON.stringify(parseProps(content)) +" });" + node.source());
            }




      });



    }








    /*
    output = falafel(content, function (node) {
      if (node.type === 'Property' && node.key.name === 'render') {
        node.parent.properties
          .filter(function (p) {
            return p.type == "Property" && p.key.name == "render"
          })
          .map(function (p) {
            return p.value.body.body.filter(function (b) {
              return b.type === "ReturnStatement";
            })[0].argument;
          })
          .forEach(function (p) {
            p.update("React.createElement('div',  {style: {border: '3px solid red'}}, 'NAME: ' + this.constructor.displayName  +  ' PROPS: ' + JSON.stringify(this.props) +  '---STATE: ' + JSON.stringify(this.state), " + p.source() + "   )");
          });
      }
    });

    */


  //  output =  "module.exports = global."+  +" = " +  "require(" + JSON.stringify("-!" + content) + ");";



  }

  else{
    output = content;
  }

  return "" + output;

}
