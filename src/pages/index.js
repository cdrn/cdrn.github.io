import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Messenger from "../components/messenger"
import baseStyles from "../css/base.module.css"

const IndexPage = () => (
  <Layout>
    <div
      style={{
        display: `flex`,
        alignItems: `center`,
        justifyContent: `center`,
        flexDirection: `column`,
        height: `70vh`,
      }}
    >
      <SEO title="cdrn" titleTemplate={`%s`} />
      <h1 className="braille-name">
        <Messenger news={[`Chris Doran`, `⠠⠡⠗⠊⠌⠕⠏⠓⠻⠀⠠⠙⠕⠗⠁⠝`]} />
      </h1>
      <h2>
        <Messenger news={[`Software Engineer`, `⠠⠎⠷⠞⠺⠜⠑⠀⠠⠑⠝⠛⠔⠑⠻`]} />
      </h2>
      <div className={baseStyles.projectContainer}>
        <h2>
          Check out my projects{" "}
          <Link className={baseStyles.link} to="/projects/">
            here
          </Link>
        </h2>
      </div>
    </div>
  </Layout>
)

export default IndexPage
