import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { Link, graphql } from "gatsby"

const BlogIndex = (props) => {
  const postList = props.data.allMarkdownRemark
  return (
    <Layout>
      <div style={{
        display: `flex`,
        alignItems: `center`,
        flexDirection: `column`,
        height: `70vh`,
      }}>
        <SEO title="cdrn - Blog" titleTemplate={`%s`}/>
        <h1>This is the blog</h1>
        {postList.edges.map(({ node }, i) => (
        <Link to={node.frontmatter.slug} key={i} className="link" >
          <div className="post-list">
            <h1>{node.frontmatter.title}</h1>
            <span>{node.frontmatter.date}</span>
            <p>{node.excerpt}</p>
          </div>
        </Link>
      ))}
      </div>
    </Layout>
  )
}

export default BlogIndex

export const listQuery = graphql`
  query ListQuery {
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
      edges {
        node {
          excerpt(pruneLength: 250)
          frontmatter {
            date
            title
          }
        }
      }
    }
  }
`
