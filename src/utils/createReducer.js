export function createReducer (initialState, fnMap) {
  return (state = initialState, action, ...rest) => {
    const handler = fnMap[action.type]
    return handler ? handler(state, action.payload ? action.payload : action.location, ...rest) : state
  }
}

export default createReducer
