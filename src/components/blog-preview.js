import React, { Component } from 'react'
import { Link } from 'gatsby'

import './blog-preview.css'

/**
 * This component is intended to house "blog preview" cards/entries
 * on the blogs index page.
 */
export default class BlogPreview extends Component {

  render () {
    return(
      <Link to={`blog/${this.props.slug}/`} key={this.props.index} className="blog-preview" >
          <div className="post-list">
            <h2>{this.props.title}</h2>
            <p>Posted on: {this.props.date}</p>
            <p>By: {this.props.author}</p>
            <p>{this.props.excerpt}</p>
          </div>
        </Link>
    )
  }
}