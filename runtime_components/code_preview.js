"use strict"

var React = require('react');


var CodePreview = React.createClass({
  generatePropsString: function(componentProps){
    return Object.keys(componentProps)
      .map(function(key){
        return key + "={" + JSON.stringify(componentProps[key]) + "}";
      }).join(' ');
  },

  render: function () {
    return (
      <div style={{margin: "30px auto", width: "500px"}}>
        <code>
         {"<" + this.props.name + " " + this.generatePropsString(this.props.componentProps) + " />" }
        </code>
      </div>
    );
  }
});

module.exports = CodePreview;