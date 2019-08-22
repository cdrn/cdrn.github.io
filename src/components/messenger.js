// USING:
// import Messenger from './Messenger'
// <Messenger news={['your', 'array', 'with', 'strings', 'here']}/>

import React, { Component } from "react";

export default class Messenger extends Component {
  state = {
    mainMessage: "",
    codeletters: "&#*+%?£@§$",
    messages: [],
    currentMessageIndex: 0,
    currentMessage: undefined,
  }
  componentDidMount() {
    // Default message is mainMessage
    this.setState(({ mainMessage: this.props.news[this.state.currentMessageIndex] }))
  }
  generateRandomString = length => {
    let random_text = ""
    while (random_text.length < length) {
      random_text += this.state.codeletters.charAt(
        Math.floor(Math.random() * this.state.codeletters.length)
      )
    }
    return random_text;
  }
  // This is our function responsible for cycling the text between our states
  cycleText = () => {
    // Create a timeout loop where we're shuffling characters until we get back to our state
    this.cycleNews()
    this.setState({ mainMessage: this.generateRandomString(this.state.mainMessage.length) })
  }
  cycleNews () {
    let newIndex = 0
    if (this.state.currentMessageIndex + 1 >= this.props.news.length) {
      newIndex = 0
    } else {
      newIndex = this.state.currentMessageIndex + 1
    }
    this.setState({
      currentMessage: this.props.news[newIndex],
      currentMessageIndex: newIndex
    }, () => {
      this.animateTextInsertion()
    })
  }
  // Cycle and animate in our string's stuff one by one
  animateTextInsertion = () => {
    if (this.state.mainMessage === this.state.currentMessage) {
      return // Bail, our job is done
    }
    let override = this.generateRandomString(this.state.mainMessage.length)
    let returnArray = []
    let congruentIndexes = []
    override.split('').forEach((char, idx) => {
      if (this.state.mainMessage.charAt(idx) !== this.state.currentMessage.charAt(idx)) {
        returnArray.push(char)
      } else {
        returnArray.push(this.state.currentMessage.charAt(idx))
        congruentIndexes.push(idx)
      }
    })
    // Replace one letter with a real one
    let randomReplacement = 0
    while (congruentIndexes.includes(randomReplacement)) {
      randomReplacement = Math.floor(Math.random() * (this.state.currentMessage.length + 1))
    }
    returnArray[randomReplacement] = this.state.currentMessage[randomReplacement]
    this.setState({ mainMessage: returnArray.join('') })
    setTimeout(this.animateTextInsertion, 5)
  }
  render() {
    return (
      <div className="messenger BreakingNewsLine">
        <span
          onMouseEnter={this.cycleText}
          onMouseLeave={this.cycleText}
        >{this.state.mainMessage}</span>
      </div>
    )
  }
}