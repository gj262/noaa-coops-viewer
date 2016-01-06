// Only update victory chart elements when their data ref or visible
// attribute changes.

import React from 'react'
import { VictoryLine } from 'victory'

class StaticVictoryLine extends React.Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    visible: React.PropTypes.bool.isRequired
  }

  shouldComponentUpdate(nextProps) {
    return this.props.data !== nextProps.data || this.props.visible !== nextProps.visible
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
