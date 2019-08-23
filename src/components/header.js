import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import Messenger from '../components/messenger'

const Header = ({ siteTitle }) => (
  <header
    style={{
      marginBottom: `1.45rem`,
      display: `flex`,
      paddingLeft: `5rem`,
      paddingRight: `5rem`
    }}
  >
    <h2>
      {/* Note, this goes to the file hosted in the static folder */}
      <a href="/curriculum-vitae-christopher-doran.pdf">
        <Messenger news={['⠠⠠⠉⠧', 'Curriculum Vitae']}/>
      </a>
    </h2>
  
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
