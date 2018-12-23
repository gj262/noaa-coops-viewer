// Only update victory chart elements when key attributes change.

import PropTypes from 'prop-types'

import React from 'react'
import { VictoryLine } from 'victory-line'

class StaticVictoryLine extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    updateAttrs: PropTypes.string.isRequired
  }

  shouldComponentUpdate (nextProps) {
    return (
      this.props.data !== nextProps.data ||
      this.props.updateAttrs !== nextProps.updateAttrs
    )
  }

  render () {
    return <VictoryLine {...this.props} />
  }
}

export { StaticVictoryLine }
