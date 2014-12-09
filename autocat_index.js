



module.exports = function(React){

  var DevCard = require('./devcard')(React);

  return React.createClass({
    render: function () {
      return (
        <div>
          { __AUTOCAT_COMPONENTS__.map(function (C) {
            return (
              <DevCard componentName={C.name} fileName={C.fileName} initState={C.props}>
                <C.component />
              </DevCard>
            );
          })}
        </div>
      )
    }
  });

}
