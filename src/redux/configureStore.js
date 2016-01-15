import thunk from 'redux-thunk'
import rootReducer from './modules'
import {
  applyMiddleware,
  compose,
  createStore
} from 'redux'

export default function configureStore () {
  let createStoreWithMiddleware

  const middleware = applyMiddleware(thunk)

  createStoreWithMiddleware = compose(middleware)

  const store = createStoreWithMiddleware(createStore)(
    rootReducer
  )

  return store
}
