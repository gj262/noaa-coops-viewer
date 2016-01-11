// Only update victory chart elements when key attributes change.

import React from 'react'
import { VictoryLine } from 'victory'

class StaticVictoryLine extends React.Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    visible: React.PropTypes.bool.isRequired,
    thin: React.PropTypes.bool.isRequired,
    range: React.PropTypes.array.isRequired
  };

  shouldComponentUpdate(nextProps) {
    return this.props.data !== nextProps.data ||
      this.props.visible !== nextProps.visible ||
      this.props.thin !== nextProps.thin ||
      this.props.range[0] !== nextProps.range[0] ||
      this.props.range[1] !== nextProps.range[1]
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
