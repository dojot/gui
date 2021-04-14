import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';


class ContextMenu {
    // context menu based at: https://codepen.io/devhamsters/pen/yMProm
    updateCurrentContextMenu(event, root) {
        // console.log("updateCurrentContextMenu");
        const clickX = event.clientX;
        const clickY = event.clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const rootW = root.offsetWidth;
        const rootH = root.offsetHeight;
        const right = screenW - clickX > rootW;
        const left = !right;
        const top = screenH - clickY > rootH;
        const bottom = !top;
        const { style } = root;
        if (right) style.left = `${clickX + 5}px`;
        if (left) style.left = `${clickX - rootW - 5}px`;
        if (top) style.top = `${clickY + 5}px`;
        if (bottom) style.top = `${clickY - rootH - 5}px`;
        return style;
    }
}

class ContextMenuComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.contextMenu = new ContextMenu();
    }

    componentDidMount() {
        const { metadata: { event } } = this.props;
        const style = this.contextMenu.updateCurrentContextMenu(event, this.root);
        this.root.style.top = style.top;
        this.root.style.left = style.left;
    }

    componentDidUpdate() {
        const { metadata: { event } } = this.props;
        const style = this.contextMenu.updateCurrentContextMenu(event, this.root);
        this.root.style.top = style.top;
        this.root.style.left = style.left;
    }

    render() {
        const { metadata: md, closeContextMenu } = this.props;
        return (
            <div
                ref={(ref) => {
                    this.root = ref;
                }}
                className="contextMenu"
            >
                <Link to={`/device/id/${md.device_id}/detail`} title="View details">
                    <div className="contextMenu--option cmenu">
                        <i className="fa fa-info-circle" />
                        Details
                    </div>
                </Link>
                <div
                    tabIndex="0"
                    role="button"
                    onClick={() => {
                        closeContextMenu();
                    }}
                    onKeyPress={() => {
                        closeContextMenu();
                    }}
                    className="contextMenu--option cmenu"
                >
                    <i className="fa fa-close" />
                    Close Menu

                </div>

            </div>
        );
    }
}

ContextMenuComponent.defaultProps = {
    metadata: {},
};

ContextMenuComponent.propTypes = {
    metadata: PropTypes.shape({
    }),
    closeContextMenu: PropTypes.func.isRequired,
};

export default ContextMenuComponent;
