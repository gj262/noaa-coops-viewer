import PropTypes from 'prop-types'
import React from 'react'
import Select from 'react-select'

import './StationSelector.scss'

export default class StationSelector extends React.Component {
  static propTypes = {
    stations: PropTypes.array.isRequired,
    selectedStationID: PropTypes.string.isRequired,
    selectStationID: PropTypes.func.isRequired
  }

  render () {
    var options = this.makeStationOptions()
    return (
      <div className='text-left col-xs-offset-3 col-xs-6 col-lg-offset-4 col-lg-4 '>
        <Select
          value={this.props.selectedStationID}
          clearable={false}
          options={options}
          onChange={this.selectStationID}
        />
      </div>
    )
  }

  makeStationOptions () {
    return this.props.stations.map(station => {
      return {
        value: station.ID,
        label: `${station.name} ${station.state} (${station.ID})`
      }
    })
  }

  selectStationID = stationID => {
    this.props.selectStationID(stationID)
  }
}
