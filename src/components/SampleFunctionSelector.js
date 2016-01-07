import React from 'react'

import './SampleFunctionSelector.scss'

export default class SampleFunctionSelector extends React.Component {
  static propTypes = {
    sampleFunctions: React.PropTypes.array.isRequired,
    selection: React.PropTypes.array.isRequired,
    toggleSampleFunction: React.PropTypes.func
  }

  render () {
    return (
        <div>
        <ul className='sample-functions'>
        {this.props.sampleFunctions.map(sampleFunction => (
            <li key={sampleFunction}>
            {sampleFunction}
            &nbsp;
            <input
               type='checkbox'
               checked={this.isChecked(sampleFunction)}
               onChange={this.sampleFunctionSelect.bind(this, sampleFunction)} />
            </li>
        ))}
        </ul>
        </div>
    )
  }

  isChecked(sampleFunction) {
    return this.props.selection.indexOf(sampleFunction) !== -1
  }

  sampleFunctionSelect(sampleFunction) {
    this.props.toggleSampleFunction(sampleFunction)
  }
}
