import PropTypes from 'prop-types'
import React from 'react'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'

export default class Root extends React.Component {
  static propTypes = {
    routes: PropTypes.element.isRequired,
    store: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  render () {
    return (
      <Provider store={this.props.store}>
        <ConnectedRouter history={this.props.history}>
          {this.props.routes}
        </ConnectedRouter>
      </Provider>
    )
  }
}
