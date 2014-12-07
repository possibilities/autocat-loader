

var React =  require('/Users/opengov/WebstormProjects/DataManagerSandbox/node_modules/react/addons');


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

    var foldedProps = _.reduce(this.props.initState, function(memo, e) { memo[e.name] = {type: e.type, isRequired: e.isRequired, data: ({number: 0, array: [], string: ""})[e.type] }; return memo;  }, {});
    return foldedProps;
  },

  componentDidMount: function () {
    this.tryMountChild();
  },


  render: function () {

    var component = React.Children.only(this.props.children);
    var name = this.props.componentName;
    var fileName = this.props.fileName;
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
              <h3>{name + ' - ' + fileName}</h3>
              <h4>{this.props.initState} </h4>
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
        {this.state && this.state.errors ? JSON.stringify(this.state.errors) : null}
      </div>
    );
  },


  tryMountChild: function () {
    var mountNode = this.refs.mount.getDOMNode();
    var props = _.mapValues(this.state, function (v, k) {
      return v.data;
    });
    var ChildComponent = React.addons.cloneWithProps(React.Children.only(this.props.children), props);

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


        this.tryMountChild();

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


module.exports = DevCard;

