import PropTypes, { func } from 'prop-types';
import i18n from 'i18next';
import React, { Component } from 'react';
import { DojotBtnClassic } from '../DojotButton';

export default class ImportExport extends Component {
    render() {
        const {
            children,
            handleClick,
            save,
            label,
            closeModal,
        } = this.props;

        return (
            <div>
                <div className="import-export row">
                    <div className="main-head">
                        {React.Children.map(children, (child, i) => {
                        // Aceita só o primeiro elemento filho
                            if (i >= 1) return null;
                            return child;
                        })}
                    </div>
                    <div className="main">
                        {React.Children.map(children, (child, i) => {
                        // Ignora o primeiro elemento filho
                            if (i < 1) return null;
                            return child;
                        })}
                    </div>
                    <div className="footer">
                        <DojotBtnClassic is_secondary onClick={closeModal} label={i18n.t('cancel.label')} title={i18n.t('cancel.label')} />
                        {save ? (
                            <DojotBtnClassic
                                is_secondary={false}
                                onClick={handleClick}
                                label={label}
                                title={label}
                            />
                        )
                            : null }
                    </div>
                </div>
                <div className="rightsidebar" onClick={closeModal} onKeyPress={closeModal} role="button" tabIndex={0} />
            </div>
        );
    }
}

ImportExport.propTypes = {
    closeModal: PropTypes.func.isRequired,
    save: PropTypes.bool.isRequired,
    label: PropTypes.string,
    children: PropTypes.arrayOf(PropTypes.object).isRequired,
    handleClick: PropTypes.func,

};

ImportExport.defaultProps = {
    label: '',
    handleClick: func,
};
