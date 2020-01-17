/*global chrome*/
import React from 'react';
import utils from '../utils';

export default class Popup extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      newSpaceName: ""
    }

    this.changeName = this.changeName.bind(this);
    this.takeSnapshot = this.takeSnapshot.bind(this);
    this.openDash = this.openDash.bind(this);
  }

  changeName = (e) => {
    this.setState({ newSpaceName: e.target.value })
  }

  takeSnapshot = () => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const spaceName = this.state.newSpaceName || `Space from ${new Date().toDateString()}`;
      chrome.storage.sync.get("spaces", (spacesObj) => {
        const newSpaces = utils.isEmpty(spacesObj) ? {} : spacesObj.spaces;
        newSpaces[spaceName] = tabs;
        chrome.storage.sync.set({"spaces": newSpaces}, () => {
          // List update ping?
          this.setState({ newSpaceName: "" });
          chrome.runtime.sendMessage({value: "reload"});
        });
      });
    })
  }

  openDash = () => {
    chrome.tabs.create({ url: "dashboard.html" });
  }

  render = () => {
    return (
      <div className="App">
        <h3>New Space Name:</h3>
        <input type="text" value={this.state.newSpaceName} onChange={this.changeName}/>
        <button onClick={this.takeSnapshot}>Take Snapshot</button>
        <button onClick={this.openDash}>View Spaces</button>
      </div>
    );
  }

}