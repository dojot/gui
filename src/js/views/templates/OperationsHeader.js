import React from 'react';
import PropTypes from 'prop-types';
import { DojotBtnLink } from 'Components/DojotButton';
import TemplateActions from 'Actions/TemplateActions';
import {
    withNamespaces,
} from 'react-i18next';
import Can from '../../components/permissions/Can';

const OperationsHeader = ({ toggleSearchBar, t }) => (
    <div className="col s5 pull-right pt10">
        <div
            className="searchBtn"
            title="Show search bar"
            onClick={toggleSearchBar}
            onKeyPress={toggleSearchBar}
            role="button"
            tabIndex="0"
        >
            <i className="fa fa-search" />
        </div>
        <Can do="modifier" on="device-manager-template">
            <DojotBtnLink
                responsive="true"
                onClick={() => TemplateActions.selectTemplate()}
                label={t('templates:header.new.label')}
                alt={t('templates:header.new.alt')}
                icon="fa fa-plus"
                className="w130px"
            />
        </Can>
    </div>
);

OperationsHeader.propTypes = {
    toggleSearchBar: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(OperationsHeader);
