import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import Messenger from "../components/messenger"
import headerStyles from "../css/header.module.css"

const Header = ({ siteTitle }) => (
  <header className={headerStyles.header}>
    <div className={headerStyles.leftContent}>
      <h2 className="header-item">
        {/* Note, this goes to the file hosted in the static folder */}
        <Link to="/">Home</Link>
      </h2>
      <h2 className="header-item">
        {/* Note, this goes to the file hosted in the static folder */}
        <Link to="/blog/">Blog</Link>
      </h2>
      <h2 className="header-item">
        {/* Note, this goes to the file hosted in the static folder */}
        <Link to="/projects/">Projects</Link>
      </h2>
    </div>
    <div className={headerStyles.rightContent}>
      <h2 className="header-item">
        {/* Note, this goes to the file hosted in the static folder */}
        <a href="/curriculum-vitae-christopher-doran.pdf">
          <Messenger news={["⠠⠠⠉⠧", "Curriculum Vitae"]} />
        </a>
      </h2>

      <h2 className="header-item">
        <a href="https://linkedin.com/in/cdrn/" target="_blank">
          <Messenger news={["⠇⠔⠅⠫⠔", "LinkedIn"]} />
        </a>
      </h2>

      <h2 className="header-item">
        <a href="https://github.com/cdrn/" target="_blank">
          <Messenger news={["⠛⠊⠹⠥⠃", "GitHub"]} />
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
