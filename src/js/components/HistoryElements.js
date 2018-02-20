import React, { Component } from 'react';

class Graph extends Component{
  constructor(props) {
    super(props);
  }

  render() {

    console.log("Graph Render", this.props);
    let labels = [];
    let values = [];

    function getValue(tuple) {
      let val_type = typeof tuple.attrValue;
      if (val_type === "string" && tuple.attrType !== "string") {
        if (tuple.attrValue.trim().length > 0) {
          if (tuple.attrType.toLowerCase() === 'integer') {
            return parseInt(tuple.attrValue);
          } else if (tuple.attrType.toLowerCase() === 'float'){
            return parseFloat(tuple.attrValue);
          }
        }
      } else if (val_type === "number") {
        return tuple.attrValue;
      }

      return undefined;
    }

    this.props.data.value.map((i) => {
      labels.push(util.iso_to_date(i.ts));
      values.push(i.trim());
    })

    if (values.length === 0) {
      return (
        <div className="valign-wrapper full-height background-info no-data-av">
          <div className="full-width center">No data available</div>
        </div>
      )
    }

    let filteredLabels = labels.map((i,k) => {
      if ((k === 0) || (k === values.length - 1)) {
        return i;
      } else {
        return "";
      }
    });

    const data = {
      labels: labels,
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
          data: values
        }
      ]
    };

    const options = {
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{ display: false }]
      },
      layout: {
        padding: { left: 10, right: 10 }
      }
    };

    return (
      <Line data={data} options={options}/>
    )
  }
}


function HistoryList(props) {
  const empty = (
    <div className="full-height background-info valign-wrapper no-data-av">
      <div className="center full-width">No data available</div>
    </div>
  );

  // handle values
  let value = []
  for(let k in props.device.value){
     value[k] = props.device.value[k];
  }


  if (value){
    let data = value;
    let trimmedList = data.filter((i) => {
      return i.trim().length > 0
    })

    trimmedList.reverse();

    if (trimmedList.length > 0) {
      return (
        <div className="relative full-height" >
          <div className="full-height full-width scrollable history-list">
            {trimmedList.map((i,k) => {
              return (<div className={"row " + (k % 2 ? "alt-row" : "")} key={i.ts}>
                <div className="col s7 value">{i}</div>
                <div className="col s5 label">{util.iso_to_date(i.ts)}</div>
              </div>
            )})}
          </div>
        </div>
      )
    }
  }
  return empty;
}


function Attr(props) {
  const known = {
    'integer': Graph,
    'float': Graph,
    'string': HistoryList,
    'geo': HistoryList,
    'default': HistoryList
  };

  const Renderer = props.type in known ? known[props.type] : known['default'];
  console.log("Attr!!! ",props);
  function NoData() {
      return (
        <div className="mt60px full-height background-info">
          <div className="full-width center">No data received</div>
        </div>
      )
  }

  function NoDataAv() {
      return (
        <div className="mt60px full-height background-info">
          <div className="full-width center">No data available</div>
        </div>
      )
  }

  if (props.data === undefined) {
    return <NoData />;
  }
  
    if (props.data.value.length == 0) {
      return <NoDataAv />;
    }
  

  return (
    <Renderer {...props} />
  )
  
}

export { Attr };

