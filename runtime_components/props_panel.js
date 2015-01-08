"use strict"

var React = require('react');

var JSONEditor = require('jsoneditor');

var PropsPanel = React.createClass({

  componentDidMount: function(){
    if(this.refs.editorMount) {
      this.editor = new JSONEditor(this.refs.editorMount.getDOMNode(), {
        "mode": "tree",
        "search": true,
        change: this.handleJSONEditorUpdate,
        error:this.handleJSONEditorError
      });
      this.editor.set(this.props.propsObject);
      this.editor.expandAll();
    }
  },

  handleJSONEditorUpdate: function(){
    console.log(this.editor.get());
    this.props.onInputChange(this.editor.get());
  },

  handleJSONEditorError: function(err){
    var errColl = this.state.errors ? this.state.errors : [];
    errColl.push(err.message);
    this.setState({errors: errColl});
  },

  render: function () {
    return (
      <div ref="editorMount" />
    );
  }
});


module.exports = PropsPanel;