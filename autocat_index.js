"use strict"


module.exports = function(React){

  var DevCard = require('./devcard')(React);

  var PropsPanel = React.createClass({
    render: function () {
      return (
        <ul>
        {this.props.propsArray.map(function(e){
          return(
            <li>{JSON.stringify(e)}</li>
          )
        })}
        </ul>
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
