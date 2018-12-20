import React from 'react'
import ReactDOM from 'react-dom'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import thunkMiddleware from 'redux-thunk'
import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, createStore, combineReducers } from 'redux'
import 'utils/logging'
import routes from './routes'
import reducers from './reducers'
import Root from './containers/Root'

const createRootReducer = history =>
  combineReducers({ router: connectRouter(history), ...reducers })

const history = createBrowserHistory()

const store = createStore(
  createRootReducer(history),
  {},
  compose(applyMiddleware(routerMiddleware(history), thunkMiddleware))
)

// Render the React application to the DOM
ReactDOM.render(
  <Root history={history} routes={routes} store={store} />,
  document.getElementById('root')
)
