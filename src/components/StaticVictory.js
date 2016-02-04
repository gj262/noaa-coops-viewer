// Only update victory chart elements when key attributes change.

import React from 'react'
import { VictoryLine } from 'victory'

class StaticVictoryLine extends React.Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    updateAttrs: React.PropTypes.string.isRequired
  };

  shouldComponentUpdate(nextProps) {
    return this.props.data !== nextProps.data ||
           this.props.updateAttrs !== nextProps.updateAttrs
  }

  render() {
    return (
      <VictoryLine {...this.props} />
    )
  }
}

export {
  StaticVictoryLine
}
