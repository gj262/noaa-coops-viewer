import PropTypes from 'prop-types'
import React from 'react'
import 'styles/core.scss'

export default class CoreLayout extends React.Component {
  static propTypes = {
    children: PropTypes.element
  }

  constructor () {
    super()
    this.state = {
      ...this.getPageSize()
    }
  }

  componentDidMount () {
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize (e) {
    e.preventDefault()
    this.setState(this.getPageSize())
  }

  getPageSize () {
    var width = document.documentElement.clientWidth
    var height = document.documentElement.clientHeight
    return {
      pageWidth: width,
      pageHeight: height
    }
  }

  render () {
    var childrenWithPageSize = React.Children.map(
      this.props.children,
      child => {
        return React.cloneElement(child, { ...this.state })
      }
    )
    return (
      <div className='page-container'>
        <div className='view-container'>{childrenWithPageSize}</div>
      </div>
    )
  }
}
