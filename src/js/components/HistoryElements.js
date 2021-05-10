/* eslint-disable */
import React, { Component, Fragment, useEffect, useCallback, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DeviceActions from 'Actions/DeviceActions';
import FirmwareHelper from '../comms/firmware/FirmwareHelper';
import util from '../comms/util/util';
import { SmallPositionRenderer } from 'Views/utils/Maps';
import { t } from 'i18next';
import LeafMap, {MapWithSocket} from '../views/utils/LeafMap';

const CommandFooter = ({ deviceId, attrLabel, deviceType = '' }) => {

    const [input, setInput] = useState('');
    const handleClick = () => {
        DeviceActions.triggerActuator(deviceId, { attrs: { [attrLabel]: input } }, () => {
            setInput('');
        });
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleClick();
        }
    };
    if (deviceType === 'actuator') {
        return (
            <div className={'card-footer-action'}>
                <input
                    className={'sender-input'}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyPress={(event) => handleKeyPress(event)}
                />
                <button
                    className={'sender-button'}
                    onClick={() => handleClick()}
                >
                    <i className={'fa fa-paper-plane'} />
                </button>
            </div>
        );
    }
    return null;
};

const NoData = ({ device, attr, deviceType }) => (
    <Fragment>
        <div className="details-card-content">
            <div className="details-card-text">{t('devices:no_data_received')}</div>
        </div>
        <CommandFooter deviceId={device.id} attrLabel={attr} deviceType={deviceType} />
    </Fragment>
);

const NoDataAv = ({ device, attr, deviceType }) => (
    <Fragment>
        <div className="details-card-content">
            <div className="details-card-text">{t('devices:no_data_avaliable')}</div>
        </div>
        <CommandFooter deviceId={device.id} attrLabel={attr} deviceType={deviceType} />
    </Fragment>
);

const Graph = (props) => {

    const labels = [];
    const values = [];

    props.MeasureStore.data[props.device.id][`_${props.attr}`].map(
        i => {
            labels.push(util.iso_to_date_hour(i.ts));
            values.push(i.value);
        }
    );

    if (values.length === 0) {
        return (
            <div className="valign-wrapper full-height background-info no-data-av">
                <div className="full-width center">No data available</div>
            </div>
        );
    }

    const filteredLabels = labels.map((i, k) => {
        if ((k === 0) || (k === values.length - 1)) {
            return i;
        }
        return '';
    });

    const data = {
        labels,
        xLabels: filteredLabels,
        datasets: [
            {
                label: 'Device data',
                fill: false,
                lineTension: 0.1,
                backgroundColor: 'rgba(75,192,192,0.4)',
                borderColor: 'rgba(235,87,87,1)',
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: 'rgba(235,87,87,1)',
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgba(235,87,87,1)',
                pointHoverBorderColor: 'rgba(220,220,220,1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: values,
            },
        ],
    };

    const options = {
        maintainAspectRatio: false,
        legend: { display: false },
        scales: {
            xAxes: [{
                ticks: {
                    fontSize: 9,
                    fontColor: '#000000',
                    fontWeight: 'bold',
                },
            }],
        },
        layout: {
            padding: { left: 10 },
        },
    };

    return (
        <div className='graphLarge'>
            <Line data={data} options={options} />
        </div>

    );
};

const HistoryList = (props) => {
    // handle values
    const listValues = [];

    //Get attribute type to compare with received value
    const attrType = props.type === 'bool' ? 'boolean' : props.type;


    for (const index in props.MeasureStore.data[props.device.id][`_${props.attr}`]) {
        listValues[index] = props.MeasureStore.data[props.device.id][`_${props.attr}`][index];
    }
    if (listValues.length > 0) {
        listValues.reverse();

        return (
            <div className="display-flex-column full-height">
                <div className="full-height full-width history-list">
                    {listValues.map((i, k) => (
                        <div className={'history-row'} key={i.ts}>
                            <div className="value">
                                {
                                    ((typeof i.value === 'boolean') && (attrType === typeof i.value)) ?
                                        <Fragment>{i.value.toString()}</Fragment>
                                        :
                                        <Fragment>
                                            {
                                                ((attrType === typeof i.value) && (attrType !== 'object' && (i.value !== null) && (i.value.length !== undefined) && (i.value.length > 0))) ?
                                                    <Fragment> {i.value.toString()} </Fragment>
                                                    :
                                                    <Fragment>
                                                        {
                                                            ((attrType === typeof i.value) && (attrType.toLowerCase() === 'object') && i.value !== null) ?
                                                                <pre>{JSON.stringify(i.value, undefined, 2)}</pre>
                                                                :
                                                                <span className="red-text">
                                                                    <em><Trans i18nKey="devices:invalid_data" /></em>
                                                                </span>
                                                        }
                                                    </Fragment>
                                            }
                                        </Fragment>
                                }


                            </div>
                            <div className="label">{util.iso_to_date(i.ts)}</div>
                        </div>
                    ))}
                </div>
                <CommandFooter deviceId={props.device.id} attrLabel={props.attr}
                    deviceType={props.deviceType} />
            </div>
        );
    } else {
        return (
            <div className="valign-wrapper full-height background-info">
                <div className="full-width center">
                    No data
                    <br />
                    available
                </div>
            </div>
        );
    }
};

class HandleGeoElements extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
            hasPosition: false,
            pos: []
        };
        this.handleDevicePosition = this.handleDevicePosition.bind(this);
        this.copyingStaticAttr = this.copyingStaticAttr.bind(this);
        this.toogleExpand = this.toogleExpand.bind(this);
    }

    toogleExpand(state) {
        this.setState({ opened: state });
    }

    copyingStaticAttr(device) {
        let newDev = {};
        newDev.id = device.id;
        newDev.sp_value = device.sp_value;
        newDev.label = device.label;
        newDev.timestamp = device.timestamp;
        newDev.tracking = device.tracking;
        newDev.is_visible = device.is_visible;
        return newDev;
    }

    handleDevicePosition(device) {
        const validDevices = [];
        for (const j in device.attrs) {
            for (const i in device.attrs[j]) {
                if (device.attrs[j][i].type === 'static') {
                    if (device.attrs[j][i].value_type === 'geo:point') {
                        const aux = device.attrs[j][i].static_value;
                        const parsedPosition = aux.split(',');
                        device.sp_value = [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
                    }
                } else if (device.attrs[j][i].type === 'dynamic') {
                    device.has_dynamic_position = true;
                    device.active_tracking = false;
                    device.allow_tracking = false;
                    device.dy_positions = [
                        {
                            id: device.id,
                            unique_key: device.unique_key,
                            position: device.position,
                            label: device.label,
                            timestamp: device.timestamp
                        }];
                }
            }
        }
        device.is_visible = true;
        if (device.sp_value !== null || device.has_dynamic_position) {
            validDevices.push(device);
        }
        return validDevices;
    }

    render() {
        if (this.props.device === undefined) {
            return (<NoData />);
        }

        let validDevices = null;
        if (this.props.isStatic) {
            // create aux variable
            validDevices = [this.copyingStaticAttr(this.props.device)];
            // searching for attribute
            let attr = {};
            Object.values(this.props.device.attrs)
                .forEach(arry => {
                    arry.forEach(element => {
                        if (element.label === this.props.attr) {
                            attr = element;
                        }
                    });
                });

            // set label and st value
            validDevices[0].label = attr.label;
            validDevices[0].is_visible = true;
            const aux = attr.static_value;
            const parsedPosition = aux.split(',');
            validDevices[0].sp_value = [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];

        } else {
            // dynamic attribute
            validDevices = this.handleDevicePosition(this.props.MeasureStore.data[this.props.device.id]);
        }

        if (validDevices.length === 0)  return <NoData />;

        if (this.props.isStatic) {
            return <LeafMap point={validDevices[0].sp_value}> </LeafMap>;
        } else {
            return (
                <MapWithSocket
                    device={validDevices[0]}
                    initialZoom={14}
                    attributeLabel={this.props.label}
                />
            );
        }
    }
}

const Attr = (props) => {
    const known = {
        integer: Graph,
        float: Graph,
        string: HistoryList,
        geo: HistoryList,
        default: HistoryList,
        boolean: HistoryList,
        'geo:point': HandleGeoElements,
    };

    const Renderer = props.type in known ? known[props.type] : known.default;

    if (props.isStatic) {
        return <Renderer {...props} />;
    }

    if (!props.MeasureStore.data[props.device.id]) {
        return <NoData {...props} />;
    }

    if (!props.MeasureStore.data[props.device.id][`_${props.attr}`]) {
        return <NoDataAv {...props} />;
    }

    //this is used in firmware update, its just a expect to show the full infos about state and result
    const newValuesForFwStateAndResult = FirmwareHelper.transformStatusToFullTextStatus(props.metadata, props.MeasureStore.data[props.device.id][`_${props.attr}`]);
    if (newValuesForFwStateAndResult !== null) {
        props.MeasureStore.data[props.device.id][`_${props.attr}`] = newValuesForFwStateAndResult;
        return (
            <HistoryList {...props} type="string" />
        );
    }

    return <Renderer {...props} />;

};

export { Attr, HandleGeoElements };
