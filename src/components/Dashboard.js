/*global chrome*/
import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import "./Dashboard.css";
import utils from '../utils';
import default_fav from "../../public/default_fav.png";

export default class Dashboard extends React.Component {
    
    constructor(props) {
        super(props);
        
        this.state = {
            spaces: {}
        }

        this.getSpaces = this.getSpaces.bind(this);
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

    render = () => {
        console.log(this.state.spaces);
        return (
            <div className="dashboard">
                {Object.keys(this.state.spaces).map((space, index) => (
                    <div className="space" key={index}>
                        <h2 className="space-title">{space}</h2>
                        <Tabs className="space-card">
                            <TabList>
                            {this.state.spaces[space].map((tab, index) => (
                                <Tab key={index}><img src={utils.isValidUrl(tab.favIconUrl) ? tab.favIconUrl : default_fav} className="tab-fav" alt={index}/></Tab>
                            ))}
                            </TabList>
                            
                            {this.state.spaces[space].map((tab, index) => (
                                <TabPanel key={index}>
                                  <h2>{tab.title}</h2>
                                </TabPanel>
                            ))}
                        </Tabs>
                    </div>
                ))}
            </div>
        )
    }
}