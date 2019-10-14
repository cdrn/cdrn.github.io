import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import Messenger from '../components/messenger'

const Header = ({ siteTitle }) => (
  <header
    style={{
      marginBottom: `1.45rem`,
      paddingLeft: `5rem`,
      paddingRight: `5rem`,
      height: `5rem`,
      display: `flex`
    }}
  >
  <div style={{
    display: 'flex',
    justifyContent: 'flex-start',
    width: '50%',
  }}>  
    <h2 className='header-item'>
      {/* Note, this goes to the file hosted in the static folder */}
      <Link to="/">
        Home
      </Link>
    </h2>
    <h2 className='header-item'>
      {/* Note, this goes to the file hosted in the static folder */}
      <Link to="/blog/">
        Blog
      </Link>
    </h2>
  </div>
  <div style={{
    display: 'flex',
    justifyContent: 'flex-end',
    width: '50%',
  }}>

    <h2 className='header-item'>
      {/* Note, this goes to the file hosted in the static folder */}
      <a href="/curriculum-vitae-christopher-doran.pdf">
        <Messenger news={['⠠⠠⠉⠧', 'Curriculum Vitae']}/>
      </a>
    </h2>

    <h2 className='header-item'>
      <a href="https://linkedin.com/in/cdrn/" target="_blank">
        <Messenger news={['⠇⠔⠅⠫⠔', 'LinkedIn']}/>
      </a> 
    </h2>

    <h2 className='header-item'>
      <a href="https://github.com/cdrn/" target="_blank">
        <Messenger news={['⠛⠊⠹⠥⠃', 'GitHub']}/>
      </a> 
    </h2>
    
    </div>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
