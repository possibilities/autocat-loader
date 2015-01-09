# AutoCat (autocat-loader)

A webpack loader for the automatic generation of a living component catalog for your React applications




###Setup


**package.json**

Add the following entry to your `package.json`  (TODO: Publish to npm)

```
 "autocat-loader": "git+ssh://git@github.com:gurdasnijor/autocat-loader.git"
```


**webpack.config.js**

Here's an example of a webpack config file that uses the loader

```javascript
var webpack = require('webpack');

module.exports = {
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    './scripts/example'
  ],
  output: {
    path: __dirname,
    filename: 'bundle.js',
    publicPath: '/scripts/'
  }
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.jsx$/, loaders: ['autocat', 'jsx'] },
    ]
  }
};
```
