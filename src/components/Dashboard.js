/*global chrome*/
import React from 'react';
import { Tabs, Button, Dropdown, Menu, Carousel } from 'antd';
import "antd/dist/antd.css";
import ModalForm from "./ModalForm";
import "./Dashboard.css";
import utils from '../utils';
import default_fav from "../../public/default_fav.png";
import shortid from 'shortid';

const { TabPane } = Tabs;


export default class Dashboard extends React.Component {
    
    constructor(props) {
        super(props);
        
        this.state = {
            spaces: {},
            editModalOpen: false,
            editModalId: "",
            editModalName: "",
            editModalTabs: [],
            tabToSpace: {}
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

        chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
            if (info.status == "complete" && this.state.tabToSpace.hasOwnProperty(tabId)) {
                const spaceId = this.state.tabToSpace[tabId];
                const spaces = { ...this.state.spaces };
                const tabs = { ...this.state.spaces[spaceId].tabs }
                tabs[tabId] = tab;
                const space = { ...spaces[spaceId], tabs };
                spaces[spaceId] = space;

                chrome.tabs.remove(tabId);

                chrome.storage.sync.set({ "spaces": spaces });

                this.setState({ spaces });
            }
        })
    }
    
    getSpaces = () => {
        chrome.storage.sync.get("spaces", (spacesObj) => {
            const spaces = utils.isEmpty(spacesObj) ? {} : spacesObj.spaces;
            const tabToSpace = {};
            Object.keys(spaces).forEach(spaceId => {
                Object.keys(spaces[spaceId].tabs).forEach(tabId => {
                    tabToSpace[tabId] = spaceId;
                })
            })
            this.setState({ spaces, tabToSpace });
        });
    }
    
    openSpace = (spaceId) => () => {
        const { tabs } = this.state.spaces[spaceId];
        const tabUrls = Object.keys(tabs).map(tabId => ( tabs[tabId].url || tabs[tabId].pendingUrl ));
        chrome.windows.create({
            url: tabUrls
        })
    }

    addSpace = () => {
        // const id = shortid.generate();
        // const space = {
        //     id,
        //     name: "",
        //     tabs: {}
        // }

        // const spaces = { ...this.state.spaces };
        // spaces[id] = space;

        this.setState({ editModalId: shortid.generate(), editModalOpen: true, editModalName: "", editModalTabs: { "dummy": { id: "dummy", url: "" } } });
    }
    
    editSpace = (spaceId) => () => {
        const space = this.state.spaces[spaceId];
        this.setState({
            editModalId: spaceId,
            editModalOpen: true,
            editModalName: space.name,
            editModalTabs: space.tabs
        })
    }

    handleSpaceEditSubmit = (space) => {
        console.log(space.tabs);
        const spaces = { ...this.state.spaces };
        spaces[this.state.editModalId] = space;

        const tabToSpace = { ...this.state.tabToSpace };
        Object.keys(space.tabs).forEach(tabId => {
            tabToSpace[tabId] = this.state.editModalId;
        })
        
        chrome.storage.sync.set({"spaces": spaces});

        this.setState({ spaces, tabToSpace, editModalOpen: false, editModalId: "", editModalName: "", editModalTabs: {} })
    }
    
    handleSpaceEditCancel = () => {
        this.setState({ editModalOpen: false, editModalId: "", editModalName: "", editModalTabs: {} })
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
        const modalProps = {
            visible: this.state.editModalOpen,
            onOk: null,
            onCancel: this.handleSpaceEditCancel,
            onSubmit: this.handleSpaceEditSubmit,
            name: this.state.editModalName,
            tabs: this.state.editModalTabs,
            spaceId: this.state.editModalId
        }


        const spacesArr = Object.keys(this.state.spaces).map(spaceId => this.state.spaces[spaceId]);
        const numFullSlides = Math.floor(Object.keys(this.state.spaces).length / 8);
        const slides = [];
        for (let i = 0; i < numFullSlides; i++) {
            const slideSpaces = [];
            for (let j = i*8; j < i*9; j++) {
                const space = spacesArr[j];
                slideSpaces.push(
                    <div className="space" key={j}>
                        <div className="space-action">
                            <h3 className="space-title" onClick={this.openSpace(space.id)}>{space.name}</h3>
                            <span className="big-spacer"/>
                            <Dropdown overlay={this.optionsMenu(space.id)} trigger={["click"]}>
                                <Button className="space-button" shape="circle" icon="more"/>
                            </Dropdown>
                        </div>
                        <Tabs type="card" className="space-card">
                            {Object.keys(space.tabs).map((tabId, index) => {
                                const tabObj = space.tabs[tabId];
                                return (
                                    <TabPane className="tab" key={index} tab={<img src={utils.isValidUrl(tabObj.favIconUrl) ? tabObj.favIconUrl : default_fav} className="tab-fav" alt={index}/>}>
                                        <a className="tab-title" href={tabObj.url || tabObj.pendingUrl} target="_blank" rel="noopener noreferrer">{tabObj.title || (tabObj.url || tabObj.pendingUrl)}</a>
                                    </TabPane>
                                )
                            })}
                        </Tabs>
                    </div>
                )
            }
            
            slides.push(
                <div className="dashboard-slide full-slide">
                    {slideSpaces}
                </div>
            )
        }
        const tailSpaces = [];
        for (let t = numFullSlides*8; t < Object.keys(this.state.spaces).length; t++) {
            const space = spacesArr[t];
            tailSpaces.push(
                <div className="space" key={t}>
                    <div className="space-action">
                        <h3 className="space-title" onClick={this.openSpace(space.id)}>{space.name}</h3>
                        <span className="big-spacer"/>
                        <Dropdown overlay={this.optionsMenu(space.id)} trigger={["click"]}>
                            <Button className="space-button" shape="circle" icon="more"/>
                        </Dropdown>
                    </div>
                    <Tabs type="card" className="space-card">
                        {Object.keys(space.tabs).map((tabId, index) => {
                            const tabObj = space.tabs[tabId];
                            return (
                                <TabPane className="tab" key={index} tab={<img src={utils.isValidUrl(tabObj.favIconUrl) ? tabObj.favIconUrl : default_fav} className="tab-fav" alt={index}/>}>
                                    <a className="tab-title" href={tabObj.url || tabObj.pendingUrl} target="_blank" rel="noopener noreferrer">{tabObj.title || (tabObj.url || tabObj.pendingUrl)}</a>
                                </TabPane>
                            )
                        })}
                    </Tabs>
                </div>
            )
        }
        slides.push(
            <div className="dashboard-slide tail-slide">
                {tailSpaces}
            </div>
        )
        

        return (
            <div className="dashboard">
                <Carousel afterChange={(a, b, c) => {console.log(a, b, c)}}>
                    {slides}
                </Carousel>
                <ModalForm {...modalProps}/>
            </div>
        )
    }
}