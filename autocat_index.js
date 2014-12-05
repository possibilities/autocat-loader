
var React =  require('/Users/opengov/WebstormProjects/DataManagerSandbox/node_modules/react');

var DevCard = require('./devcard');


var AutoCatApp = React.createClass({
  render: function () {
    return (
      <div>
       { __AUTOCAT_COMPONENTS__.map(function (C) {
         return (
           <DevCard componentName={C.name} fileName={C.fileName} initState={C.props}>
             <C.component />
           </DevCard>
         );
       }) }
      </div>
    )
  }
});

module.exports = AutoCatApp;

