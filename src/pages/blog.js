import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import BlogPreview from "../components/blog-preview"
import { graphql } from "gatsby"

const BlogIndex = (props) => {
  const postList = props.data.allMarkdownRemark
  return (
    <Layout>
      <div style={{
        display: `flex`,
        alignItems: `center`,
        flexDirection: `column`,
        height: `70vh`
      }}>
        <SEO title="cdrn - Blog" titleTemplate={`%s`}/>
        <h1>Blog</h1>
        {postList.edges.map(({ node }, i) => (
          <BlogPreview 
            index={i}
            slug={node.frontmatter.slug}
            title={node.frontmatter.title}
            date={node.frontmatter.date}
            author={node.frontmatter.author}
            tags={node.frontmatter.tags}
            excerpt={node.excerpt}
          />
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
          excerpt(pruneLength: 550)
          frontmatter {
            date
            author
            title
            tags
            slug
          }
        }
      }
    }
  }
`
