/*global chrome*/
import React from 'react';
import { Button, Modal, Input, Icon, Form } from 'antd';
import shortid from 'shortid';
import "antd/dist/antd.css";
import utils from '../utils';

export default Form.create({ name: "edit_snapshot_form" })(class ModalForm extends React.Component {

    removeTab = id => {
        const { form } = this.props;
        const tabs = form.getFieldValue('tabs');
        if (Object.keys(tabs).length === 1) {
            return;
        }

        form.setFieldsValue({
            tabs: utils.filterObj(tabs, (tabId) => (tabId !== id)),
        });
    };
    
    addTab = () => {
        const { form } = this.props;
        const id = shortid.generate();
        const tabs = form.getFieldValue('tabs'); 
        tabs[id] = { id };

        form.setFieldsValue({ tabs });
    };

    onSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const { tabUrls, name } = values;
                const prevTabs = this.props.tabs;
                
                const prevUrls = Object.keys(prevTabs).map(tabId => prevTabs[tabId].url);
                console.log("prevUrls: ", prevUrls);
                
                const finalUrls = Object.keys(tabUrls).map(tabId => tabUrls[tabId]);
                console.log("finalUrls:", finalUrls);
                
                const newUrls = finalUrls.filter(finalUrl => !prevUrls.includes(finalUrl))
                console.log("newUrls: ", newUrls);

                if (newUrls.length > 0) {
                    chrome.windows.create({ url: newUrls, focused: false, state: "minimized" }, (window) => {
                        
                        const tabs = utils.getTabsObj(window.tabs);
                        const keptTabIds = Object.keys(prevTabs).filter(tabId => finalUrls.includes(prevTabs[tabId].url));
                        
                        keptTabIds.forEach(tabId => {
                            tabs[tabId] = prevTabs[tabId];
                        });
                        
    
    
                        const snapshot = {
                            id: this.props.snapshotId,
                            name,
                            tabs
                        }
                        
                        this.props.onSubmit(snapshot);
    
                        this.props.form.resetFields();
                    });
                } else {
                    const tabs = {}
                    const finalTabIds = Object.keys(tabUrls);
                    finalTabIds.forEach(tabId => {
                        tabs[tabId] = prevTabs[tabId];
                    });

                    const snapshot = {
                        id: this.props.snapshotId,
                        name,
                        tabs
                    }
                    
                    this.props.onSubmit(snapshot);

                    this.props.form.resetFields();
                }
            }
        });
    }

    onCancel = () => {
        this.props.form.resetFields();
        this.props.onCancel();
    }

    render = () => {
        const { getFieldDecorator, getFieldValue } = this.props.form;
        getFieldDecorator('tabs', { initialValue: this.props.tabs });
        const tabs = getFieldValue('tabs');
        return (
            <Modal
            title="Edit Snapshot"
            visible={this.props.visible}
            onOk={this.onSubmit}
            onCancel={this.onCancel}
            >
                <Form onSubmit={this.onSubmit}>
                    <Form.Item label="Snapshot Name">
                        {getFieldDecorator('name', {
                            initialValue: this.props.name,
                            rules: [{ required: true, message: "You must name your snapshot"}]
                        })(<Input/>)}
                    </Form.Item>
                    {Object.keys(tabs).map((tabId, index) => {
                        const tab = tabs[tabId];
                        return (
                        <Form.Item key={tabId} label={index === 0 ? 'Tab URLs' : ''} required={false}>
                            {getFieldDecorator(`tabUrls[${tabId}]`, {
                                initialValue: tab.url,
                                validateTrigger: ['onChange', 'onBlur'],
                                rules: [
                                    {
                                        required: true,
                                        message: "Please input tab URL or delete this field.",
                                    },
                                    {
                                        pattern: utils.urlRegex,
                                        message: "Must be a properly formatted URL (include http/https)"
                                    }
                                ],
                            })(<Input style={{ width: '95%', marginRight: 8 }} />)}
                            {Object.keys(tabs).length > 1 ? (
                            <Icon
                                className="delete-icon"
                                type="minus-circle-o"
                                onClick={() => this.removeTab(tabId)}
                            />
                            ) : null}
                        </Form.Item>
                        )
                    })}
                    <Button type="dashed" onClick={this.addTab} style={{ width: '95%' }}>
                        <Icon type="plus" /> Add tab
                    </Button>
                </Form>
            </Modal>
        )
    }
})