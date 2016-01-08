// Only update victory chart elements when their data ref, visible or thin
// attributes change.

import React from 'react'
import { VictoryLine } from 'victory'

class StaticVictoryLine extends React.Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    visible: React.PropTypes.bool.isRequired,
    thin: React.PropTypes.bool.isRequired
  };

  shouldComponentUpdate(nextProps) {
    return this.props.data !== nextProps.data ||
      this.props.visible !== nextProps.visible ||
      this.props.thin !== nextProps.thin
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
