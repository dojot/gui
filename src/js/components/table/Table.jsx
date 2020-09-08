import React from 'react';
import moment from 'moment';
import PropTypes, {
    shape,
    arrayOf,
    oneOfType,
    instanceOf,
} from "prop-types";
import styles from './style.scss';


const Table = (props) => {
    const {
        itemList = [], isFetching, t, title,
    } = props;

    const row = itemList.map((item) => {
        const {
            attr, value, ts,
        } = item;
        return (
            <tr key="tr-63546">
                <td>{attr}</td>
                <td>
                    {
                        typeof (value) === 'object' ? JSON.stringify(value)
                            : value.toString()
                    }
                </td>
                <td>{moment(ts).format('DD/MM/YYYY HH:mm:ss')}</td>

            </tr>
        );
    });

    const tableHTML = (
        <div className={styles.tableScrollable}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>{title}</th>
                    </tr>
                    <tr>
                        <th>{t('report:reports.attr')}</th>
                        <th>{t('report:reports.value')}</th>
                        <th>{t('report:reports.date')}</th>
                    </tr>
                </thead>
                <tbody>
                    {row}
                </tbody>
            </table>
        </div>
    );
    return (
        <div className={styles.tableContainer}>
            {isFetching ? <div className={styles.tableScrollable} /> : tableHTML}
        </div>
    );
};

Table.defaultProps = {
    isFetching: false,
};

Table.propTypes = {
    itemList: arrayOf(shape({
        attr: PropTypes.string,
        value: oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.object,
        ]),
        ts: instanceOf(Date),
    })).isRequired,
    isFetching: PropTypes.bool,
    t: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default Table;
