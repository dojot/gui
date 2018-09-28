/* eslint-disable */
import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import Script from 'react-load-script';
import util from '../comms/util/util';
import { SmallPositionRenderer } from "../views/utils/Maps";



class Graph extends Component {
    render() {
        const labels = [];
        const values = [];

        function getValue(tuple) {
            const val_type = typeof tuple.attrValue;
            if (val_type === 'string' && tuple.attrType !== 'string') {
                if (tuple.attrValue.trim().length > 0) {
                    if (tuple.attrType.toLowerCase() === 'integer') {
                        return parseInt(tuple.attrValue);
                    } if (tuple.attrType.toLowerCase() === 'float') {
                        return parseFloat(tuple.attrValue);
                    }
                }
            } else if (val_type === 'number') {
                return tuple.attrValue;
            }

            return undefined;
        }

        this.props.MeasureStore.data[this.props.device.id][`_${this.props.attr}`].map(
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
            <Line data={data} options={options} />
        );
    }
}


function HistoryList(props) {
    // handle values
    const value = [];
    for (const k in props.MeasureStore.data[props.device.id][`_${props.attr}`]) {
        value[k] = props.MeasureStore.data[props.device.id][`_${props.attr}`][k];
    }

    if (value.length > 0) {
        const trimmedList = value.filter((i) => {
            if (i.value.length != undefined) {
                return i.value.length > 0;
            }
           else {
              return true;
            };
          
         });

        trimmedList.reverse();

        if (trimmedList.length > 0) {
            return (
                <div className="relative full-height">
                    <div className="full-height full-width history-list">
                        {trimmedList.map((i, k) => (<div className={`history-row ${k % 2 ? 'alt-row' : ''}`} key={i.ts}>
                            <div className="value">{i.value.toString()}</div>
                            <div className="label">{util.iso_to_date(i.ts)}</div>
                        </div>
                        ))}
                    </div>
                </div>
            );
        }
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
}

class HandleGeoElements extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
            hasPosition: false,
            pos: []
        };

        this.handleDevicePosition = this.handleDevicePosition.bind(this);
        this.toogleExpand = this.toogleExpand.bind(this);
    }

    toogleExpand(state) {
        this.setState({ opened: state });
    }

    handleDevicePosition(device) {
        function parserPosition(position) {
            const parsedPosition = position.split(',');
            return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
        }

        const validDevices = [];
        for (const j in device.attrs) {
            for (const i in device.attrs[j]) {
                if (device.attrs[j][i].type === 'static') {
                    if (device.attrs[j][i].value_type === 'geo:point') {
                        device.position = parserPosition(device.attrs[j][i].static_value);
                    }
                }
            }
        }

        device.select = true;
        if (device.position !== null && device.position !== undefined) {
            validDevices.push(device);
        }
        return validDevices;
    }

    render() {
        function NoData() {
            return (
                <div className="valign-wrapper full-height background-info">
                    <div className="full-width center">
No position
                        <br />
available
                    </div>
                </div>
            );
        }

        if (this.props.device === undefined) {
            return (<NoData />);
        }

        let validDevices = null;
        if (this.props.isStatic) {
            // static attribute
            validDevices = this.handleDevicePosition(this.props.device);
        } else {
            // dynamic attribute
            validDevices = this.handleDevicePosition(this.props.MeasureStore.data[this.props.device.id]);
        }

        let geoconfs = this.props.Config;
        if (geoconfs == undefined)
            geoconfs = {}

            
        let opened = util.checkWidthToStateOpen(this.state.opened);
            
        if (validDevices.length == 0) {
            return <NoData />;
        }
        else
        {
            if (this.props.isStatic) {
                return <div className={"attributeBox " + (opened ? "expanded" : "compressed")}>
                    <div className="header">
                        <label>{this.props.label}</label>
                        {!this.state.opened ? <i onClick={this.toogleExpand.bind(this, true)} className="fa fa-expand" /> : <i onClick={this.toogleExpand.bind(this, false)} className="fa fa-compress" />}
                    </div>
                    <SmallPositionRenderer showLayersIcons={false} devices={validDevices} allowContextMenu={false} center={validDevices[0].position} zoom={14} showPolyline={false} config={geoconfs} />
                </div>;
            } else {
                return <span>
                    <SmallPositionRenderer showLayersIcons={false} devices={validDevices} allowContextMenu={false} center={validDevices[0].position} zoom={14} showPolyline={false} config={this.props.Config} />
                </span>;
            }
        }
    }
}

function Attr(props) {
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
    function NoData() {
        return (
            <div className="mt60px full-height background-info">
                <div className="full-width center">No data received</div>
            </div>
        );
    }

    function NoDataAv() {
        return (
            <div className="mt60px full-height background-info">
                <div className="full-width center">No data available</div>
            </div>
        );
    }

    if (props.MeasureStore.data[props.device.id] === undefined) {
      return <NoData />;
    }

    if (props.MeasureStore.data[props.device.id][`_${props.attr}`] == undefined) {
      return <NoDataAv />;
    }


    return (
        <Renderer {...props} />
    );
}

export { Attr, HandleGeoElements };
