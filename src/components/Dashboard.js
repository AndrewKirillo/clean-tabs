/*global chrome*/
import React from 'react';
import { Tabs, Button, Dropdown, Menu, Carousel, Empty } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons';
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
            snapshots: {},
            editModalOpen: false,
            editModalId: "",
            editModalName: "",
            editModalTabs: [],
            tabToSnapshot: {},
            screenWidth: 0
        }

        this.carousel = React.createRef();
        this.updateScreenWidth = this.updateScreenWidth.bind(this);

        this.getSnapshots = this.getSnapshots.bind(this);
        this.openSnapshot = this.openSnapshot.bind(this);
        this.optionsMenu = this.optionsMenu.bind(this);
        this.carouselPrev = this.carouselPrev.bind(this);
        this.carouselNext = this.carouselNext.bind(this);
    }
    
    componentDidMount = () => {
        this.updateScreenWidth();
        window.addEventListener('resize', this.updateScreenWidth);
        
        this.getSnapshots();
        
        chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
            if (request.value === "reload") {
                this.getSnapshots();
            }
        })

        chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
            chrome.windows.getCurrent(currWindow => {
              if(currWindow.id !== tab.windowId) {
                if (info.status == "complete" && this.state.tabToSnapshot.hasOwnProperty(tabId)) {
                    const snapshotId = this.state.tabToSnapshot[tabId];
                    const snapshots = { ...this.state.snapshots };
                    const tabs = { ...this.state.snapshots[snapshotId].tabs }
                    tabs[tabId] = utils.getTabsObj([tab])[tabId];
                    const snapshot = { ...snapshots[snapshotId], tabs };
                    snapshots[snapshotId] = snapshot;
    
                    chrome.tabs.remove(tabId);
    
                    chrome.storage.local.set({ "snapshots": snapshots });
    
                    this.setState({ snapshots });
                }
              }
            })
        })
    }

    updateScreenWidth = () => {
        this.setState({ screenWidth: window.innerWidth });
    }
    
    getSnapshots = () => {
        chrome.storage.local.get("snapshots", (snapshotsObj) => {
            const snapshots = utils.isEmpty(snapshotsObj) ? {} : snapshotsObj.snapshots;
            const tabToSnapshot = {};
            Object.keys(snapshots).forEach(snapshotId => {
                Object.keys(snapshots[snapshotId].tabs).forEach(tabId => {
                    tabToSnapshot[tabId] = snapshotId;
                })
            })
            this.setState({ snapshots, tabToSnapshot });
        });
    }
    
    openSnapshot = (snapshotId) => () => {
        const { tabs } = this.state.snapshots[snapshotId];
        const tabUrls = Object.keys(tabs).map(tabId => ( tabs[tabId].url || tabs[tabId].pendingUrl ));
        chrome.windows.create({
            url: tabUrls
        })
    }

    addSnapshot = () => {
        this.setState({ editModalId: shortid.generate(), editModalOpen: true, editModalName: "", editModalTabs: { "dummy": { id: "dummy", url: "" } } });
    }
    
    editSnapshot = (snapshotId) => () => {
        const snapshot = this.state.snapshots[snapshotId];
        this.setState({
            editModalId: snapshotId,
            editModalOpen: true,
            editModalName: snapshot.name,
            editModalTabs: snapshot.tabs
        })
    }

    handleSnapshotEditSubmit = (snapshot) => {
        console.log(snapshot.tabs);
        const snapshots = { ...this.state.snapshots };
        snapshots[this.state.editModalId] = snapshot;

        const tabToSnapshot = { ...this.state.tabToSnapshot };
        Object.keys(snapshot.tabs).forEach(tabId => {
            tabToSnapshot[tabId] = this.state.editModalId;
        })
        
        chrome.storage.local.set({"snapshots": snapshots});

        this.setState({ snapshots, tabToSnapshot, editModalOpen: false, editModalId: "", editModalName: "", editModalTabs: {} })
    }
    
    handleSnapshotEditCancel = () => {
        this.setState({ editModalOpen: false, editModalId: "", editModalName: "", editModalTabs: {} })
    }

    deleteSnapshot = (snapshotId) => () => {
        const snapshots = this.state.snapshots;
        delete snapshots[snapshotId];
        
        chrome.storage.local.set({ snapshots }, () => {
            this.setState({ snapshots });
        });
    }
    
    optionsMenu = (snapshotId) => (
        <Menu>
            <Menu.Item key="1" onClick={this.editSnapshot(snapshotId)}>
                Edit
            </Menu.Item>
            <Menu.Item key="2" onClick={this.deleteSnapshot(snapshotId)}>
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
        const modalProps = {
            visible: this.state.editModalOpen,
            onOk: null,
            onCancel: this.handleSnapshotEditCancel,
            onSubmit: this.handleSnapshotEditSubmit,
            name: this.state.editModalName,
            tabs: this.state.editModalTabs,
            snapshotId: this.state.editModalId
        }


        const snapshotsArr = Object.keys(this.state.snapshots).map(snapshotId => this.state.snapshots[snapshotId]);
        const slides = [];
        snapshotsArr.forEach((snapshot, snapshotIndex) => {
            slides.push(
                <div className="dashboard-slide full-slide">
                    <div className="snapshot" key={snapshotIndex}>
                        <div className="snapshot-action">
                            <a className="snapshot-title" onClick={this.openSnapshot(snapshot.id)}>{snapshot.name}</a>
                            <span className="big-spacer"/>
                            <Dropdown overlay={this.optionsMenu(snapshot.id)} trigger={["click"]}>
                                <Button className="snapshot-button" shape="circle" icon="more"/>
                            </Dropdown>
                        </div>
                        <Tabs type="card" className="snapshot-card">
                            {Object.keys(snapshot.tabs).map((tabId, index) => {
                                const tabObj = snapshot.tabs[tabId];
                                return (
                                    <TabPane className="tab" key={index} tab={<img src={utils.isValidUrl(tabObj.favIconUrl) ? tabObj.favIconUrl : default_fav} className="tab-fav" alt={index}/>}>
                                        <a href={tabObj.url || tabObj.pendingUrl} target="_blank" rel="noopener noreferrer" className="tab-link-button"><ExportOutlined /></a>
                                        <h4 className="tab-title">{tabObj.title || (tabObj.url || tabObj.pendingUrl)}</h4>
                                    </TabPane>
                                )
                            })}
                        </Tabs>
                    </div>
                </div>
            )
        })
        

        const numSlides = Object.keys(this.state.snapshots).length/(this.state.screenWidth < 1300 ? 4 : 6);
        const carouselProps = {
            dots: false,
            rows: 2,
            slidesPerRow: this.state.screenWidth < 1300 ? 2 : 3
        };
        return (
            <div className="dashboard-page">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <Button className="dashboard-add-button" type="primary" size="large" shape="round" onClick={this.addSnapshot} >
                        <PlusOutlined />
                        Add Snapshot
                    </Button>
                </div>
                <div className="dashboard">
                    {numSlides <= 1 ? null : 
                    <Button className="dashboard-carousel-button dashboard-carousel-prev" size="large" shape="circle" onClick={this.carouselPrev}>
                        <LeftOutlined />
                    </Button>
                    }
                    {numSlides == 0 ? <Empty imageStyle={{marginTop: "4rem"}} description={<p className="dashboard-carousel-empty-message">No Snapshots</p>}/> : 
                    <Carousel {...carouselProps} ref={node => (this.carousel = node)} className="dashboard-carousel">
                        {slides}
                    </Carousel>
                    }
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