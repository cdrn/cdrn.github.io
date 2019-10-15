import React, { Component } from 'react'
import { Link } from 'gatsby'
import Img from "gatsby-image"

import './blog-preview.css'

/**
 * This component is intended to house "blog preview" cards/entries
 * on the blogs index page.
 */
export default class BlogPreview extends Component {
  render () {
    let imageElement
    if (this.props.image) {
      const imageFluid = this.props.image.childImageSharp.fluid
      imageElement = 
      <div className="image-preview">
        <Img fluid={imageFluid}></Img>
      </div>
    }
    return(
      <Link to={`blog/${this.props.slug}/`} key={this.props.index} className="blog-preview" >
          <div className="post">
            <h2>{this.props.title}</h2>
            <ul className="metadata">
            <li>
              Posted on: {this.props.date}
            </li>
            <li>
              By: {this.props.author}
            </li>
            </ul>
            <p>{this.props.excerpt}</p>
          </div>
          {imageElement}
        </Link>
    )
  }
}