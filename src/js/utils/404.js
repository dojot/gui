import React from 'react';

export default function notFound() {
    return (
        <div className="full-height relative background-info">
            <div className="valign-wrapper center-align full-height todo-div">
                <div className="full-width">
                    <i className="material-icons">error</i>
                    <div>Page Not Found</div>
                </div>
            </div>
        </div>
    );
}
