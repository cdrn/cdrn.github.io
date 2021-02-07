import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { Link } from "gatsby"

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

      <h2 className="link">
        <a href="https://shitcoin.watch">Coinwatch</a>
      </h2>
      <p>
        A bot that scrapes various messaging boards and service and collates a
        list of alt-coin mentions. Intended to show which alt coins people are
        talking about such that one can discover/ predict price movements before
        they happen.
      </p>
    </div>
  </Layout>
)

export default IndexPage
