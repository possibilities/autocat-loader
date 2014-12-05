
var React = require('react/addons');


var _ = require('lodash');

/**
 * This component acts as a harness for components; managing connecting controls to the props and managing mounting errors
 * and overall communication with the user
 * @type {*|Function}
 */

var DevCard = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getDefaultProps: function () {
    return {initState: {}};
  },

  getInitialState: function () {
    return _.cloneDeep(this.props.initState);
  },

  componentDidMount: function () {
    this.tryMountChild();
  },


  render: function () {

    var component = React.Children.only(this.props.children);
    var name = component.displayName;
    var propString = _.map(this.state, function (val, key) {
      return key + "={" + val.data + "}";
    }).join(" ");
    var markupString = "<" + name + " " + propString + " />";

    var boundInputs = !_.isEmpty(this.state) ? _.map(this.state, function (val, field) {
      return this.renderTypedInput(field);
    }, this) : null;

    return (
      <div className="ui-card__content" >
        <div className="ui-card $modifier_class" style={{height: this.props.height}}>
          <div className="ui-card__content ui-form">
            <div className="ui-width-wrapper">
              <h3>{name}</h3>
              <div className="ui-row">
                <div className="ui-col-2of6">
                  <div ref="mount" />
                </div>
                <div className="ui-col-4of6">
                  <p> {this.props.description} </p>
                    {boundInputs}
                  <pre>
                    <code> {markupString}  </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        {this.state.errors ? JSON.stringify(this.state.errors) : null}
      </div>
    );
  },


  tryMountChild: function () {
    var mountNode = this.refs.mount.getDOMNode();
    var ChildComponent = React.addons.cloneWithProps(React.Children.only(this.props.children), _.mapValues(this.state, function (v, k) {
      return v.data;
    }));

    try {
      React.unmountComponentAtNode(mountNode);
    }
    catch (e) {
    }

    try {
      React.render(
        ChildComponent,
        mountNode
      );
    }
    catch (err) {
        React.render(
          <div className="error">{err.toString()}</div>,
          mountNode
        );
    }
  },


  renderTypedInput: function (field) {

    var type = this.state[field]['type'];

    var changeHandler = function (evt) {
      var val = evt.target.value;
      var newData = {};

      if (type === "array" || type === "object") {
        try {
          val = JSON.parse(val);

          newData[field] = {data: val, type: type};

          this.setState(newData);

        }
        catch (e) {
          //TODO: figure out how to handle invalid input being live-entered -- could mean not using 'controlled components'?
          var errColl = this.state.errors ? _.cloneDeep(this.state.errors) : [];
          errColl.push(e.message);
          this.setState({errors: errColl});

        }
      }
      else {
        newData[field] = {data: val, type: type};
        this.setState(newData);
      }


    }.bind(this);


    var inputVal = (type === "array" || type === "object") ? JSON.stringify(this.state[field]['data']) : this.state[field]['data'];


    var inputTypeHash = {array: "text", object: "text", string: "text", date: "date", number: "number"};


    return (
      <fieldset className="ui-form">
        <label>{field}</label>

        <input type={inputTypeHash[type]} onChange={changeHandler}  value={inputVal} />
      </fieldset>
    );
  }

});


var AutoCatApp = React.createClass({
  render: function() {
    return (
      <ul>
      { __AUTOCAT_COMPONENTS__.map(function(C){
          return  (
            <li>
              <DevCard><C.component /></DevCard>
            </li>
          );
        })}
      </ul>
    )
  }
});


React.render(<AutoCatApp />, document.body);

