/*global chrome*/
import React from 'react';
import { Tabs, Button, Dropdown, Menu, Carousel } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
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
            tabToSpace: {},
            screenWidth: 0
        }

        this.carousel = React.createRef();
        this.updateScreenWidth = this.updateScreenWidth.bind(this);

        this.getSpaces = this.getSpaces.bind(this);
        this.openSpace = this.openSpace.bind(this);
        this.optionsMenu = this.optionsMenu.bind(this);
        this.carouselPrev = this.carouselPrev.bind(this);
        this.carouselNext = this.carouselNext.bind(this);
    }
    
    componentDidMount = () => {
        this.updateScreenWidth();
        window.addEventListener('resize', this.updateScreenWidth);
        
        this.getSpaces();
        
        chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
            if (request.value === "reload") {
                this.getSpaces();
            }
        })

        chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
            chrome.windows.getCurrent(currWindow => {
              if(currWindow.id !== tab.windowId) {
                if (info.status == "complete" && this.state.tabToSpace.hasOwnProperty(tabId)) {
                    const spaceId = this.state.tabToSpace[tabId];
                    const spaces = { ...this.state.spaces };
                    const tabs = { ...this.state.spaces[spaceId].tabs }
                    tabs[tabId] = tab;
                    const space = { ...spaces[spaceId], tabs };
                    spaces[spaceId] = space;
    
                    chrome.tabs.remove(tabId);
    
                    chrome.storage.local.set({ "spaces": spaces });
    
                    this.setState({ spaces });
                }
              }
            })
        })
    }

    updateScreenWidth = () => {
        this.setState({ screenWidth: window.innerWidth });
    }
    
    getSpaces = () => {
        chrome.storage.local.get("spaces", (spacesObj) => {
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
        
        chrome.storage.local.set({"spaces": spaces});

        this.setState({ spaces, tabToSpace, editModalOpen: false, editModalId: "", editModalName: "", editModalTabs: {} })
    }
    
    handleSpaceEditCancel = () => {
        this.setState({ editModalOpen: false, editModalId: "", editModalName: "", editModalTabs: {} })
    }

    deleteSpace = (spaceId) => () => {
        const spaces = this.state.spaces;
        delete spaces[spaceId];
        
        chrome.storage.local.set({ spaces }, () => {
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

    carouselPrev = () => {
        this.carousel.prev();
    }

    carouselNext = () => {
        this.carousel.next();
    }
    
    render = () => {
        console.log(Object.keys(this.state.spaces).length);
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
        const slides = [];
        spacesArr.forEach((space, spaceIndex) => {
            slides.push(
                <div className="dashboard-slide full-slide">
                    <div className="space" key={spaceIndex}>
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
                </div>
            )
        })
        

        const numSlides = Object.keys(this.state.spaces).length/(this.state.screenWidth < 1300 ? 4 : 6);
        const carouselProps = {
            dots: false,
            rows: 2,
            slidesPerRow: this.state.screenWidth < 1300 ? 2 : 3
        };
        return (
            <div className="dashboard-page">
                <h1 className="dashboard-title">Dashboard</h1>
                <div className="dashboard">
                    {numSlides <= 1 ? null : 
                    <Button className="dashboard-carousel-button dashboard-carousel-prev" size="large" shape="circle" onClick={this.carouselPrev}>
                        <LeftOutlined />
                    </Button>
                    }
                    <Carousel {...carouselProps} ref={node => (this.carousel = node)} className="dashboard-carousel">
                        {slides}
                    </Carousel>
                    {numSlides <= 1 ? null : 
                    <Button className="dashboard-carousel-button dashboard-carousel-next" size="large" shape="circle" onClick={this.carouselNext}>
                        <RightOutlined/>
                    </Button>
                    }
                    <ModalForm {...modalProps}/>
                </div>
            </div>
        )
    }
}