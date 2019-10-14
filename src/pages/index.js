import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Messenger from '../components/messenger'

const IndexPage = () => (
  <Layout>
  <div style={{
    display: `flex`,
    alignItems: `center`,
    justifyContent: `center`,
    flexDirection: `column`,
    height: `70vh`,
  }}>
    <SEO title="cdrn" titleTemplate={`%s`}/>
    <h1 className="braille-name">
      <Messenger news={[`⠠⠡⠗⠊⠌⠕⠏⠓⠻⠀⠠⠙⠕⠗⠁⠝`, `Christopher Doran`]}/>
    </h1>
    <h2>
      <Messenger news={[`⠠⠎⠷⠞⠺⠜⠑⠀⠠⠑⠝⠛⠔⠑⠻`, `Software Engineer`]}/>

    </h2>
  </div>
  </Layout>
)

export default IndexPage
