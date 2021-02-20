import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import baseStyles from "../css/base.module.css"

const IndexPage = () => (
  <Layout>
    <div
      style={{
        display: `flex`,
        flexDirection: `column`,
        height: `70vh`,
      }}
    >
      <SEO title="cdrn" titleTemplate={`%s`} />
      <h1>Projects</h1>
      <div className={baseStyles.projectsContainer}>
        <h2 className={`${baseStyles.link} ${baseStyles.h2}`}>
          <a href="https://altcoin.watch">Coinwatch</a>
        </h2>
        <h2>
          A bot that scrapes various messaging boards and service and collates a
          list of alt-coin mentions. Intended to show which alt coins people are
          talking about such that one can discover/ predict price movements
          before they happen.
        </h2>
      </div>
    </div>
  </Layout>
)

export default IndexPage
