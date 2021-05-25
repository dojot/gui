/* eslint-disable */
import React from 'react';

function InputCheckbox(params) {
    const { handleChangeCheckbox } = params;
    return (
        <span>
            <input
                name={params.name}
                id={params.name}
                onChange={handleChangeCheckbox}
                value={params.name}
                checked={!!params.checked}
                type="checkbox"
                disabled={params.disabled ? params.disabled : false}
            />
            <label htmlFor={params.name}>{params.label}</label>
        </span>
    );
}

function InputText(params) {
    return (
        <div className={`input-field ${params.class ? params.class : ''}`}>
            <label
                htmlFor={params.name}
                data-error={params.errorMessage ? params.errorMessage : ''}
                className="active"
            >
                {params.label}
            </label>
            <input
                value={params.value}
                name={params.name}
                onChange={params.onChange ? params.onChange : null}
                maxLength={params.maxLength ? params.maxLength : 40}
                placeholder={params.placeHolder ? params.placeHolder : ''}
                type="text"
                disabled={params.disabled ? params.disabled : false}
            />
        </div>
    );
}

export {
    InputCheckbox,
    InputText,
};
