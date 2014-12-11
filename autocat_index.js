"use strict"


module.exports = function(React){

  var DevCard = require('./devcard')(React);


  var TypedInput = React.createClass({

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
          console.log(errColl);
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



  function getDefaultDataForPropType(propTypeValueString){

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
  }


  var PropsPanel = React.createClass({

    getInitialState: function(){
      return {
        controlState: this.props.propsArray.map(function(e){
        return {
          name: e.name,
          type: /oneOf/.test(e.type) ? "enum" : e.type,
          isRequired: e.isRequired,
          data: getDefaultDataForPropType(e.type)
        }
      })}

      /*
      return this.props.propsArray.reduce(function(memo, e) {
        memo[e.name] = {
          type: e.type,
          isRequired: e.isRequired,
          data: getDefaultDataForPropType(e.type)
        }; return memo;
      }, {});
    */
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

      this.setState({controlState: this.state.controlState});


    },

    render: function () {
      return (
        <div>
        {JSON.stringify(this.state)}

        {this.state.controlState.map(function(e){
          return(
            <TypedInput onInputChange={this.handleInputChange} controlStateDescriptor={e} />
          )
        }.bind(this))}
        </div>
      );
    }
  });


  return React.createClass({
    getInitialState: function(){
      return {selectedComponent: null};
    },

    handleComponentNavigate: function(name){
      this.setState({selectedComponent: name});
    },

    /*
    getCurrentComponent: function(){
      var SelectedACItem =  __AUTOCAT_COMPONENTS__.filter(function(c){
        return c.name === this.state.selectedComponent;
      }.bind(this))[0];

      var Component = SelectedACItem.component;

      return (
        <DevCard componentName={SelectedACItem.name} fileName={SelectedACItem.fileName} initState={SelectedACItem.props}>
          <Component />
        </DevCard>
      );

    },
    */

    getComponentModelByName: function(name){
      return __AUTOCAT_COMPONENTS__.filter(function(c){
        return c.name === name;
      }.bind(this))[0];
    },

    handleBack: function(){
      this.setState({selectedComponent: null});
    },

    render: function () {

      var currComponentModel = this.getComponentModelByName(this.state.selectedComponent);

      return (
        <div>
          <aside className="ac-sidebar">
            <nav className="ui-nav-list">

              <header className="ui-panel__header">
                <div onClick={this.handleBack} className="ui-panel__back"></div>
                <h3>{this.state.selectedComponent}</h3>
              </header>

              {this.state.selectedComponent ?
                <PropsPanel propsArray={currComponentModel.props} />
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
            {/*this.getCurrentComponent()*/}

          {__AUTOCAT_COMPONENTS__.map(function(C){
            if(C.name === this.state.selectedComponent) {
              return (
                <DevCard componentName={C.name} fileName={C.fileName} initState={C.props}>
                  <C.component />
                </DevCard>
              );
            }
            else{
              return null;
            }
          }.bind(this))}
          </section>
        </div>
      )
    }
  });

}
