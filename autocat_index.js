"use strict"


module.exports = function(React){



  var TypedInput = React.createClass({
    getInitialState: function(){
      return {valueBuffer: "", errors: []};
    },

    inputChangeHandler: function(e){
      var val = e.target.value;
      var type = this.props.controlStateDescriptor.type;
      var field = this.props.controlStateDescriptor.name;
    //  var newData = {};

      if (type === "array" || type === "object") {
        try {
          val = JSON.parse(val);
          this.props.onInputChange(field, val);
        }
        catch (e) {
          var errColl = this.state.errors ? this.state.errors : [];
          errColl.push(e.message);

          this.setState({errors: errColl});

        }
      }
      else {
        this.props.onInputChange(field, val);
      }
    },

    checkboxChangeHandler: function(e){
      var isChecked = e.target.checked;
      var field = this.props.controlStateDescriptor.name;

      this.props.onInputChange(field, isChecked);

    },

    selectChangeHandler: function(e){
      var val = e.target.options[e.target.selectedIndex].value;
      var field = this.props.controlStateDescriptor.name;

      this.props.onInputChange(field, val);

    },

    render: function () {
      var type = this.props.controlStateDescriptor.type;

      return (
        <fieldset className="ui-form">
          <label>{this.props.controlStateDescriptor.name + " (" + type + ")"}</label>
          {this.getControlByDataType(type)}

        {this.state.errors.length > 0 ? JSON.stringify(this.state.errors) : null}
        </fieldset>
      );
    },

    getControlByDataType: function(type){

      var data = this.props.controlStateDescriptor.data;

      switch (type) {
        case "array":
          return  <input type="text" onChange={this.inputChangeHandler} value={data} />
          break;
        case "object":
          return  <input type="text" onChange={this.inputChangeHandler} value={data} />
          break;
        case "string":
          return  <input type="text" onChange={this.inputChangeHandler} value={data} />
          break;
        case "date":
          return  <input type="date" onChange={this.inputChangeHandler} value={data} />
          break;
        case "number":
          return  <input type="number" onChange={this.inputChangeHandler} value={data} />
          break;
        case "bool":
          return  <input type="checkbox" onChange={this.checkboxChangeHandler} value={data} />
          break;
        case "enum":
          return  (
            <select onChange={this.selectChangeHandler}>
               {data.values.map(function(e){
                 return <option value={e}>{e}</option>
               })}
            </select>
          );
          break;
      }
    }
  });

  var AutoCat = React.createClass({

    getInitialState: function(){
      return {
        controlState: [],
        selectedComponent: null
      };
    },


    getDefaultDataForPropType: function(propTypeValueString){
      //Parse out enum type (allowable set of values and a default selected value)
      if(/oneOf/.test(propTypeValueString)){
        var enumValues = JSON.parse(/\[.*?\]/.exec(propTypeValueString)[0].replace(/'/g, "\""));
        return {values: enumValues, selectedValue: enumValues[0]};
      }

      return ({
        number: 0,
        array: ["Item 1", "Item 2", "Item 3"],
        string: "",
        object:{},
        bool: true,
        func: function(e){console.log(e)}
      })[propTypeValueString];
    },

    getPropsObject: function(){
      return this.state.controlState.reduce(function(memo, e) {
        memo[e.name] = e.type === "enum" ?  e.data.selectedValue : e.data;
        return memo;
      }, {});
    },


    getInitialPropPanelControlState: function(componentName){

      var e =  __AUTOCAT_COMPONENTS__.filter(function(c){
        return c.name === componentName;
      }.bind(this))[0];

      return e.props.map(function(e){
          return {
            name: e.name,
            type: /oneOf/.test(e.type) ? "enum" : e.type,
            isRequired: e.isRequired,
            data: this.getDefaultDataForPropType(e.type)
          }
        }.bind(this));
    },

    handleComponentNavigate: function(name){
      this.setState({
        controlState: this.getInitialPropPanelControlState(name),
        selectedComponent: name,
      }, function(){ this.tryMountChild()});
    },

    handleBack: function(){
      this.setState({
        controlState: [],
        selectedComponent: null
      });
    },

    handleInputChange: function(field, data){
      console.log(field, data);

      var controlState = this.state.controlState.filter(function(e){
        return e.name === field;
      })[0];

      if (controlState.type === "enum"){
        controlState.data.selectedValue = data;
      }
      else{
        controlState.data = data;
      }
      this.setState({controlState: this.state.controlState},
        function(){ this.tryMountChild()}
      );
    },



    getComponentModelByName: function(name){
      return __AUTOCAT_COMPONENTS__.filter(function(c){
        return c.name === name;
      }.bind(this))[0];
    },


    tryMountChild: function () {
      var mountNode = this.refs.mount.getDOMNode();
      var CurrentComponentModel = this.getComponentModelByName(this.state.selectedComponent);
      var curProps = this.getPropsObject();

      var ChildComponent = React.addons.cloneWithProps(<CurrentComponentModel.component />, curProps);

      try {
        React.render(
          ChildComponent,
          mountNode
        );
      }

      catch (err) {
        React.render(
          <div className="ui-alert-box whoops">
            <span className="icon-exclamation-1"></span>
            <strong>{err.toString()}</strong>
           {err.stack}

          </div>,
          mountNode
        );
      }
    },


    render: function () {
      return (
        <div>
          <aside className="ac-sidebar">
            <nav className="ui-nav-list">
              <header className="ui-panel__header">
                <div onClick={this.handleBack} className="ui-panel__back"></div>
                <h3>{this.state.selectedComponent}</h3>
              </header>

              {this.state.selectedComponent ?
                <div>
                  {this.state.controlState.map(function(e){
                    return(
                      <TypedInput onInputChange={this.handleInputChange} controlStateDescriptor={e} />
                    )
                  }.bind(this))}
                </div>
                  :
                __AUTOCAT_COMPONENTS__.map(function (C) {
                return (
                  <a
                    className={"ui-nav-list__item " + (C.name === this.state.selectedComponent ? "is-selected" : "") }
                    onClick={this.handleComponentNavigate.bind(null, C.name)}>
                    {C.name + " - " + C.fileName}
                  </a>
                );
              }.bind(this))}
            </nav>
          </aside>
          <section className="ac-section">
          { this.state.selectedComponent ? <div ref="mount" /> : null}
          </section>
        </div>
      )
    }
  });



  return AutoCat;

}
