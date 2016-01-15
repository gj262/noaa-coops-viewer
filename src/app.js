import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import routes from './routes'
import Root from './containers/Root'
import configureStore from './redux/configureStore'

const history = createBrowserHistory()
const store = configureStore()

// Render the React application to the DOM
ReactDOM.render(
  <Root history={history} routes={routes} store={store} />,
  document.getElementById('root')
)
