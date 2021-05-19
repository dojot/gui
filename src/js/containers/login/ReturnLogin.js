import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from 'Src/config';
import LoginActions from 'Actions/LoginActions';


export default function ReturnLogin(props) {
    const [data, setData] = useState({
        userInfo: {},
        state: 'none',
        errorMsg: 'none',
    });

    useEffect(() => {
        // Since the react route failed to capture the query string, I used
        // javascript's location method.
        const { location: { href } } = window;
        const url = new URL(href);
        const stateQueryString = url.searchParams.get('state') || 'none';

        // getting the parameter state e error (if it exists) in the query string
        const errorQueryString = url.searchParams.get('error');

        if (errorQueryString) {
            // we should redirect to Login page and shows toast with the error message;
            // window.location.href = `${BASE_URL}?error=${errorQueryString}`;
            // return;
        }

        // gets a valid state;
        console.log('stateQueryString', stateQueryString);
        LoginActions.getUserData();
    }, []);


    return null;
}
