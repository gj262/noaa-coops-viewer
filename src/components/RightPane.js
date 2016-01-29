import React from 'react'
import YearSelector from 'components/YearSelector'

import './RightPane.scss'

export default class RightPane extends React.Component {
  static propTypes = {
    years: React.PropTypes.array
  };

  render () {
    return (
      <div className='right-pane'>
        <YearSelector
          selection={this.props.years}
          {...this.props} />
      </div>
    );
  }
}
