import React from 'react'
import YearSelector from 'components/YearSelector'

import './RightPane.scss'

export default class RightPane extends React.Component {
  static propTypes = {
    years: React.PropTypes.array,
    width: React.PropTypes.number.isRequired
  };

  render () {
    return (
      <div className='right-pane' style={{width: `${this.props.width}px`}}>
        <YearSelector
          selection={this.props.years}
          {...this.props} />
      </div>
    );
  }
}
