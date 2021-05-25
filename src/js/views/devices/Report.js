/* eslint-disable react/no-unused-prop-types */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DojotCustomButton } from 'Components/DojotButton';
import toaster from 'Comms/util/materialize';
import ReportTable from './ReportPage.js';

const extractAttrsLabels = (listAttrDySelected) => (listAttrDySelected.map((attr) => attr.label));

const datetimeLocalFormatInput = (t) => {
    // number to 2 digit, 0 padded string
    const p = (number) => (number.toString().padStart(2, '0'));
    return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}T${p(t.getHours())}:${p(t.getMinutes())}`;
};

const datetimeOneDayAgo = (t) => {
    t.setDate(t.getDate() - 1);
    return t;
};

const checkEqualityValuesArray = (arr1, arr2) => {
    if (arr1.length !== arr2.length) {
        return false;
    }
    return JSON.stringify(arr1.sort()) === JSON.stringify(arr2.sort());
};

class ReportComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            callReport: false,
            dateFrom: datetimeLocalFormatInput(datetimeOneDayAgo(new Date())),
            dateTo: datetimeLocalFormatInput(new Date()),
            attrsList: [],
        };
        this.checkClose = this.checkClose.bind(this);
        this.generateReportClick = this.generateReportClick.bind(this);
        this.dateToOnChange = this.dateToOnChange.bind(this);
        this.dateFromOnChange = this.dateFromOnChange.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { listAttrDySelected } = nextProps;
        const newAttrsList = extractAttrsLabels(listAttrDySelected);
        const { attrsList } = prevState;

        // if there is a change in the selected attrs, callReport=false
        if (!checkEqualityValuesArray(newAttrsList, attrsList)) {
            return {
                attrsList: newAttrsList,
                callReport: false,
            };
        }
        return null;
    }

    checkClose() {
        this.setState({
            callReport: false,
        });
    }

    dateToOnChange(e) {
        const { value } = e.target;
        this.setState({
            dateTo: value,
            callReport: false,
        });
    }

    dateFromOnChange(e) {
        const { value } = e.target;
        this.setState({
            dateFrom: value,
            callReport: false,
        });
    }

    generateReportClick() {
        const {
            attrsList,
            dateFrom,
            dateTo,
        } = this.state;

        const { t } = this.props;

        if (attrsList.length === 0) {
            toaster.warning(t('report:alerts.select_dy'));
            return;
        }

        if (dateFrom === '') {
            toaster.warning(t('report:alerts.datefrom_miss'));
            return;
        }

        if (dateTo === '') {
            toaster.warning(t('report:alerts.dateto_miss'));
            return;
        }

        const dateFromDate = new Date(dateFrom);
        const dateToDate = new Date(dateTo);

        if (dateFromDate.toString() === 'Invalid Date') {
            toaster.error(t('report:alerts.datefrom_invalid'));
            return;
        }

        if (dateToDate.toString() === 'Invalid Date') {
            toaster.error(t('report:alerts.dateto_invalid'));
            return;
        }

        if (dateFromDate.getTime() >= dateToDate.getTime()) {
            toaster.warning(t('report:alerts.datafrom_greanter_dateto'));
            return;
        }

        this.setState({ callReport: true });
    }

    render() {
        const { deviceId, t, deviceLabel } = this.props;
        const {
            callReport, attrsList, dateFrom, dateTo,
        } = this.state;
        const { checkClose } = this;

        return (
            <div className="report col s9">
                <span className="report-label">
                    {t('report:title')}
                </span>
                <span>
                    <input
                        name="dateFrom"
                        type="datetime-local"
                        value={dateFrom}
                        onChange={this.dateFromOnChange}
                        max={dateTo}
                    />
                </span>
                <span className="to-middle">
                    {t('report:to')}
                </span>
                <span>
                    <input
                        name="dateTo"
                        type="datetime-local"
                        value={dateTo}
                        onChange={this.dateToOnChange}
                        min={dateFrom}
                        max={datetimeLocalFormatInput(new Date())}
                    />
                </span>
                <span>
                    <DojotCustomButton
                        label={t('report:generate')}
                        onClick={this.generateReportClick}
                    />
                </span>
                {callReport ? (
                    <ReportTable
                        checkClose={checkClose}
                        deviceLabel={deviceLabel}
                        deviceId={deviceId}
                        attrs={attrsList}
                        dateFrom={new Date(dateFrom)}
                        dateTo={new Date(dateTo)}
                        t={t}
                    />
                ) : <div />}
            </div>
        );
    }
}

ReportComponent.defaultProps = {
    listAttrDySelected: [],
};

ReportComponent.propTypes = {
    deviceLabel: PropTypes.string.isRequired,
    deviceId: PropTypes.string.isRequired,
    listAttrDySelected: PropTypes.arrayOf(PropTypes.shape({})),
    t: PropTypes.func.isRequired,
};

export default ReportComponent;
