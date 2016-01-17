import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import routes from './routes'
import Root from './containers/Root'
import { browserHistory } from 'react-router'
import { syncHistory, routeReducer } from 'redux-simple-router'
import thunkMiddleware from 'redux-thunk'
import reducers from './reducers'
import { applyMiddleware, createStore, combineReducers } from 'redux'

const reducer = combineReducers(Object.assign({}, reducers, {
  routing: routeReducer
}))

const reduxRouterMiddleware = syncHistory(browserHistory)
const createStoreWithMiddleware = applyMiddleware(reduxRouterMiddleware, thunkMiddleware)(createStore)
const store = createStoreWithMiddleware(reducer)

// Render the React application to the DOM
ReactDOM.render(
  <Root history={browserHistory} routes={routes} store={store} />,
  document.getElementById('root')
)
