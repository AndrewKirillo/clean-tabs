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
      newSnapshotName: ""
    }

    this.changeName = this.changeName.bind(this);
    this.takeSnapshot = this.takeSnapshot.bind(this);
    this.openDash = this.openDash.bind(this);
  }

  changeName = (e) => {
    this.setState({ newSnapshotName: e.target.value })
  }

  takeSnapshot = () => {
    chrome.tabs.query({ currentWindow: true }, (tabsArr) => {

      const tabs = utils.getTabsObj(tabsArr);

      const name = this.state.newSnapshotName || `Snapshot ${new Date().toDateString()}`;
      chrome.storage.local.get("snapshots", (snapshotsObj) => {
        const snapshots = utils.isEmpty(snapshotsObj) ? {} : snapshotsObj.snapshots;
        const id = shortid.generate();
        snapshots[id] = { id, name, tabs };
        chrome.storage.local.set({ snapshots }, () => {
          this.setState({ newSnapshotName: "" });
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
        <Input value={this.state.newSnapshotName} onChange={this.changeName}/>
        <Button disabled={this.state.newSnapshotName.length > 0 ? false : true } className="popup-button" type="primary" size="large" onClick={this.takeSnapshot}><CameraOutlined/>Take Snapshot</Button>
        <Button className="popup-button" size="large" onClick={this.openDash}><DashboardOutlined/>View Dashboard</Button>
      </div>
    );
  }

}