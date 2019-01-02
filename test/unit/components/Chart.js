import { describe, it } from 'mocha'
import chai, { expect } from 'chai'
import chaiEnzyme from 'chai-enzyme'
import { mount } from 'enzyme'
import React from 'react'
import { scaleChart } from 'components/Chart'

chai.use(chaiEnzyme())

const WrappedChart = () => <div />
const Scaled = scaleChart(WrappedChart)
const ThisTest = props => (
  <Scaled pxPerPoint={1} width={1} data={[]} {...props} />
)

/* eslint-disable no-unused-expressions */

describe('scaleChart', () => {
  it('wraps', () => {
    const wrapped = mount(<ThisTest passThrough />)
    expect(wrapped.find(WrappedChart)).to.have.prop('passThrough', true)
    expect(wrapped.find(WrappedChart)).to.not.have.prop('notPassed')
  })

  it('downsamples data - 1 -> 1', () => {
    const wrapped = mount(
      <ThisTest
        data={[
          {
            data: [[{ v: 10.0, t: '2018-12-01 00:00' }]]
          }
        ]}
        width={100}
        pxPerPoint={100}
      />
    )
    expect(wrapped.find(WrappedChart))
      .to.have.prop('data')
      .deep.equal([{ data: [[{ v: 10.0, t: '2018-12-01 00:00' }]] }])
  })

  it('downsamples data - 2 -> 1', () => {
    const wrapped = mount(
      <ThisTest
        data={[
          {
            data: [
              [
                { v: 10.0, t: '2018-12-01 00:00' },
                { v: 20.0, t: '2018-12-01 01:00' }
              ]
            ]
          }
        ]}
        width={100}
        pxPerPoint={100}
      />
    )
    expect(wrapped.find(WrappedChart))
      .to.have.prop('data')
      .deep.equal([{ data: [[{ v: 15.0, t: '2018-12-01 01:00' }]] }])
  })

  it('downsamples data - 3 -> 2 points', () => {
    const wrapped = mount(
      <ThisTest
        data={[
          {
            data: [
              [
                { v: 10.0, t: '2018-12-01 00:00' },
                { v: 20.0, t: '2018-12-01 01:00' },
                { v: 30.0, t: '2018-12-01 02:00' }
              ]
            ]
          }
        ]}
        width={100}
        pxPerPoint={50}
      />
    )
    expect(wrapped.find(WrappedChart))
      .to.have.prop('data')
      .deep.equal([
        {
          data: [
            [
              { v: 15.0, t: '2018-12-01 01:00' },
              { v: 30.0, t: '2018-12-01 02:00' }
            ]
          ]
        }
      ])
  })

  it('downsamples data - 4 -> 2 points', () => {
    const wrapped = mount(
      <ThisTest
        data={[
          {
            data: [
              [
                { v: 10.0, t: '2018-12-01 00:00' },
                { v: 20.0, t: '2018-12-01 01:00' },
                { v: 30.0, t: '2018-12-01 02:00' },
                { v: 40.0, t: '2018-12-01 03:00' }
              ]
            ]
          }
        ]}
        width={100}
        pxPerPoint={50}
      />
    )
    expect(wrapped.find(WrappedChart))
      .to.have.prop('data')
      .deep.equal([
        {
          data: [
            [
              { v: 15.0, t: '2018-12-01 01:00' },
              { v: 35.0, t: '2018-12-01 03:00' }
            ]
          ]
        }
      ])
  })

  it('downsamples data - 5 -> 2 points', () => {
    const wrapped = mount(
      <ThisTest
        data={[
          {
            data: [
              [
                { v: 10.0, t: '2018-12-01 00:00' },
                { v: 20.0, t: '2018-12-01 01:00' },
                { v: 30.0, t: '2018-12-01 02:00' },
                { v: 40.0, t: '2018-12-01 03:00' },
                { v: 50.0, t: '2018-12-01 04:00' }
              ]
            ]
          }
        ]}
        width={100}
        pxPerPoint={50}
      />
    )
    expect(wrapped.find(WrappedChart))
      .to.have.prop('data')
      .deep.equal([
        {
          data: [
            [
              { v: 20.0, t: '2018-12-01 01:00' },
              { v: 45.0, t: '2018-12-01 04:00' }
            ]
          ]
        }
      ])
  })
})
