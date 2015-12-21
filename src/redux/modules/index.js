import { combineReducers } from 'redux'
import { routeReducer } from 'redux-simple-router'
import coOps from './coOps'

export default combineReducers({
  coOps,
  router: routeReducer
})
