/*global chrome*/
import React from 'react';
import { Button, Input } from 'antd';
import "antd/dist/antd.css";
import { CameraOutlined, DashboardOutlined } from '@ant-design/icons'
import shortid from 'shortid';
import utils from '../utils';
import "./Popup.css";

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
    chrome.tabs.query({ currentWindow: true }, (tabsArr) => {

      // const tabUrls = tabs.map(tab => tab.url);
      // chrome.windows.create({ url: tabUrls }, (window) => {
      //   window.tabs.forEach(tab => {
      //     chrome.tabs.update(tab.id, { active: true }, (tab) => {
      //       chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (tabScreenshot) => {
      //         console.log(tabScreenshot);
      //       })
      //     })
      //   })
      // })
      const tabs = utils.getTabsObj(tabsArr);

      const name = this.state.newSpaceName || `Snapshot ${new Date().toDateString()}`;
      chrome.storage.local.get("spaces", (spacesObj) => {
        const spaces = utils.isEmpty(spacesObj) ? {} : spacesObj.spaces;
        const id = shortid.generate();
        spaces[id] = { id, name, tabs };
        chrome.storage.local.set({ spaces }, () => {
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
      <div className="popup">
        <h3>Snapshot Name:</h3>
        <Input value={this.state.newSpaceName} onChange={this.changeName}/>
        <Button disabled={this.state.newSpaceName.length > 0 ? false : true } className="popup-button" type="primary" size="large" onClick={this.takeSnapshot}><CameraOutlined/>Take Snapshot</Button>
        <Button className="popup-button" size="large" onClick={this.openDash}><DashboardOutlined/>View Dashboard</Button>
      </div>
    );
  }

}