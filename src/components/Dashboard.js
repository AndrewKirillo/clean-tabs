/*global chrome*/
import React from 'react';
import { Tabs, Button, Dropdown, Menu, Modal, Input, Select } from 'antd';
import "antd/dist/antd.css";
import "./Dashboard.css";
import utils from '../utils';
import default_fav from "../../public/default_fav.png";

const { TabPane } = Tabs;
const { Option } = Select;


export default class Dashboard extends React.Component {
    
    constructor(props) {
        super(props);
        
        this.state = {
            spaces: {},
            editModalOpen: false,
            editModalId: "",
            editModalName: "",
            editModalTabUrls: []
        }
        
        this.getSpaces = this.getSpaces.bind(this);
        this.openSpace = this.openSpace.bind(this);
        this.optionsMenu = this.optionsMenu.bind(this);
    }
    
    componentDidMount = () => {
        this.getSpaces();
        
        chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
            if (request.value === "reload") {
                this.getSpaces();
            }
        })
    }
    
    getSpaces = () => {
        chrome.storage.sync.get("spaces", (spacesObj) => {
            const spaces = utils.isEmpty(spacesObj) ? {} : spacesObj.spaces;
            this.setState({ spaces });
        });
    }
    
    openSpace = (spaceId) => () => {
        const tabUrls = this.state.spaces[spaceId].tabs.map(tab => ( tab.url ));
        chrome.windows.create({
            url: tabUrls
        })
    }
    
    editSpace = (spaceId) => () => {
        const space = this.state.spaces[spaceId];
        const tabUrls = space.tabs.map(tab => tab.url);
        this.setState({
            editModalId: spaceId,
            editModalOpen: true,
            editModalName: space.name,
            editModalTabUrls: tabUrls
        })
    }

    handleModalNameChange = (e) => {
        this.setState({ editModalName: e.target.value });
    }

    handleSpaceEdit = () => {
        const tabs = this.state.editModalTabUrls.map(tabUrl => ({
            url: tabUrl
        }))
        const space = {
            ...this.state.spaces[this.state.editModalId],
            name: this.state.editModalName,
            tabs
        }
        
        const spaces = { ...this.state.spaces };
        spaces[this.state.editModalId] = space;
        
        chrome.storage.sync.set({"spaces": spaces});

        this.setState({ spaces, editModalId: "", editModalOpen: false, editModalId: "", editModalName: "", editModalTabUrls: [] })
    }
    
    handleSpaceEditCancel = () => {
        this.setState({ editModalId: "", editModalOpen: false, editModalId: "", editModalName: "", editModalTabUrls: [] })
    }

    handleModalTabChange = (value) => {
        this.setState({ editModalTabUrls: value })
    }

    deleteSpace = (spaceId) => () => {
        const spaces = this.state.spaces;
        delete spaces[spaceId];
        
        chrome.storage.sync.set({ spaces }, () => {
            this.setState({ spaces });
        });
    }
    
    optionsMenu = (spaceId) => (
        <Menu>
            <Menu.Item key="1" onClick={this.editSpace(spaceId)}>
                Edit
            </Menu.Item>
            <Menu.Item key="2" onClick={this.deleteSpace(spaceId)}>
                Delete
            </Menu.Item>
        </Menu>
    )
    
    render = () => {
        console.log(this.state.spaces);
        return (
            <div className="dashboard">
                {Object.keys(this.state.spaces).map((spaceId, index) => {
                    const space = this.state.spaces[spaceId];
                    return (
                        <div className="space" key={index}>
                            <div className="space-action">
                                <h3 className="space-title" onClick={this.openSpace(spaceId)}>{space.name}</h3>
                                <span className="big-spacer"/>
                                <Dropdown overlay={this.optionsMenu(spaceId)} trigger={["click"]}>
                                    <Button className="space-button" shape="circle" icon="more"/>
                                </Dropdown>
                            </div>
                            <Tabs type="card" className="space-card">
                                {space.tabs.map((tab, index) => (
                                    <TabPane className="tab" key={index} tab={<img src={utils.isValidUrl(tab.favIconUrl) ? tab.favIconUrl : default_fav} className="tab-fav" alt={index}/>}>
                                        <a href={tab.url} target="_blank" rel="noopener noreferrer">{tab.title}</a>
                                    </TabPane>
                                ))}
                            </Tabs>
                        </div>
                    )
                })}
                <Modal
                title="Edit Tab Space"
                visible={this.state.editModalOpen}
                onOk={this.handleSpaceEdit}
                onCancel={this.handleSpaceEditCancel}
                >
                    <h2 className="modal-label">Edit Space Name:</h2>
                    <Input value={this.state.editModalName} onChange={this.handleModalNameChange}/>
                    <h2 className="modal-label">Edit Space Tabs:</h2>
                    <Select mode="tags" onChange={this.handleModalTabChange} value={this.state.editModalTabUrls} tokenSeparators={[" ", ","]}>
                        {this.state.editModalTabUrls.map((tabUrl, index) => (
                            <Option key={index}>{tabUrl}</Option>
                        ))}
                    </Select>
                </Modal>
            </div>
        )
    }
}