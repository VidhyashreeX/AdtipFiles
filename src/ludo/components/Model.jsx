import React from 'react'
import '../styles/Model.css'

const Model = ({heading, children}) => {
    const test = (e) => {
        return e.stopPropagation()
    }
  return (
    <div id='model'>
        <div className='model-container' onClick={test}>
            <h2 className='model-header'>{heading}</h2>
            <div className='model-content'>{children}</div>
        </div>
    </div>
  )
}

export default Model