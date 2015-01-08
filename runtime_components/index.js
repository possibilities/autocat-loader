"use strict"

var React = require('react');

var CodePreview = require('./code_preview');
var PropsPanel = require('./props_panel');
var SplashPage = require('./splash_page');

require('jsoneditor/jsoneditor.css');
require('./autocat.css');


var AutoCat = React.createClass({

  getInitialState: function () {
    return {
      controlStateObject: {},
      selectedComponent: null
    };
  },

  handleComponentNavigate: function (name) {
    this.setState({
      controlStateObject: this._getInitialPropPanelControlStateObject(name),
      selectedComponent: name
    }, function () {
      this._tryMountChild()
    });
  },

  handleBack: function () {
    this.setState({
      controlStateObject: {},
      selectedComponent: null
    });
  },

  handleInputChangeObject: function (newObject) {
    var cso = this.state.controlStateObject;

    for (var key in newObject) {
      cso[key] = newObject[key];
    }

    this.setState({controlStateObject: cso}, this.tryMountChild);
  },


  _getDefaultDataForPropType: function (propSchema) {

    //Objects
    if (!propSchema.type && !Array.isArray(propSchema)) {
      var obj = {};
      Object.keys(propSchema).map(function (key) {
        obj[key] = this.getDefaultDataForPropType(propSchema[key]);
      }.bind(this));
      return obj;
    }

    //Arrays
    if (Array.isArray(propSchema)) {
      //Get some multiplicity of test array data
      return [1, 2, 3].map(function (i) {
        return this._getDefaultDataForPropType(propSchema[0]);
      }.bind(this));
    }

    //Enums
    if (propSchema.type === 'enum') {
      var enumValues = propSchema.enumValues;
      return enumValues[0];   //{values: enumValues, selectedValue: enumValues[0]};
    }

    //Scalars
    return ({
      number: Math.random() * 1000,
      array: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
      string: "Lorem Ipsum",
      object: {key: "value"},
      bool: true,
      func: function (e) {
        console.log(e)
      }
    })[propSchema.type];
  },

  _getPropsObject: function () {
    return this.state.controlStateObject;
  },

  _getInitialPropPanelControlStateObject: function (componentName) {

    var e = this._getComponentModelByName(componentName);
    var ret = {};

    Object.keys(e.props).map(function (key) {
      ret[key] = this._getDefaultDataForPropType(e.props[key]);
    }.bind(this));

    return ret;
  },

  _getComponentModelByName: function (name) {
    return __AUTOCAT_COMPONENTS__.filter(function (c) {
      return c.componentName === name;
    }.bind(this))[0];
  },

  _tryMountChild: function () {
    var mountNode = this.refs.mount.getDOMNode();
    var CurrentComponentModel = this._getComponentModelByName(this.state.selectedComponent);
    var curProps = this._getPropsObject();

    try {
      React.render(
        <CurrentComponentModel.component {... curProps} />,
        mountNode
      );
    }
    catch (err) {
      React.render(
        <div>
          <div className="ui-alert-box whoops">
            <span className="icon-exclamation-1"></span>
            <strong>{err.toString()}</strong>
              {err.stack}
          </div>
          <p>Please refer to the component at the path in the exception above and ensure it has all neccessary propTypes defined</p>
          <p>This tool relies on accurate propTypes to be able to provide data needed to render a component.</p>
        </div>,
        mountNode
      );
    }
  },

  render: function () {

    var currentComponent = this._getComponentModelByName(this.state.selectedComponent);
    var currentComponentProps = this._getPropsObject();

    return (
      <div>
        <aside className="ac-sidebar">
          <nav className="ui-nav-list">
            <header className="ui-panel__header">
              <div onClick={this.handleBack} className="ui-panel__back"> Back</div>
              <h3>{this.state.selectedComponent || "All Components"}</h3>
            </header>
              {this.state.selectedComponent ?
                <div className="props-panel">
                  <PropsPanel propsObject={this.state.controlStateObject} onInputChange={this.handleInputChangeObject} />
                </div>
                :
                __AUTOCAT_COMPONENTS__.map(function (C) {
                  return (
                    <a
                      className={"ui-nav-list__item " + (C.componentName === this.state.selectedComponent ? "is-selected" : "") }
                      onClick={this.handleComponentNavigate.bind(null, C.componentName)}>
                    {C.componentName + " - " + C.fileName}
                    </a>
                  );
                }.bind(this))}
          </nav>
          <div>
            {currentComponent && currentComponent.childComponents.length > 0 ?
              <div>
                <h3>Child Components </h3>
                  {currentComponent.childComponents.map(function (name) {
                    return (
                      <a
                        className={"ui-nav-list__item " + (name === this.state.selectedComponent ? "is-selected" : "") }
                        onClick={this.handleComponentNavigate.bind(null, name)}>
                        {name + " - " + currentComponent.fileName}
                      </a>
                    );
                  }.bind(this))}
              </div>
              :
              null}
             {!!currentComponent ?
               <div>
                 <h3>Used Props </h3>
                 <ul>
                   {currentComponent.usedProps.map(function (prop) {
                     return (
                       <li>{prop}</li>
                     );
                   }.bind(this))}
                 </ul>
               </div>
               :
               null}
          </div>
        </aside>
        <section className="ac-section">
            { this.state.selectedComponent ?
              <div className="component-harness">
                <div className="component-harness__metadata">
                  <h5>
                    <strong>{currentComponent.fileName + " - "} </strong>   {  currentComponent.fullPath} </h5>
                </div>
                <div ref="mount" />
                <CodePreview name={currentComponent.componentName} componentProps={currentComponentProps} />
              </div>
              :
              <SplashPage />}
        </section>
      </div>
    )
  }
});


module.exports = AutoCat;

