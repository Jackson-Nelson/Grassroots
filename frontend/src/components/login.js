import React, { useState } from "react";
import emailInput from "./assets/email-input.png";
import passInput from "./assets/pass-input.png";
import userInput from "./assets/user-input.png";
import { useEffect } from "react";
import getLocale from '../utils/getcoords.js'
import { getAuthToken } from "../App.js";


const apiURL = 'http://localhost:4000/api'

// this is the only place auth token should be set, so it is not exported
const setAuthToken = (tok, userid) => {
    localStorage.setItem("auth", tok);
    localStorage.setItem("uid", tok);
}


const getLocation = (setGeolocation) => {

    getLocale(setGeolocation);
};


const loginUser = async (loginOrRegister, formData, setLoginStatus, setSessionTok) => {

    // request to login, passing form data
    var req = new Request(`${apiURL}/${loginOrRegister}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
    })
    try {
        const response = await fetch(req);
        if (!response.ok) throw new Error(`Error while trying to ${loginOrRegister}: ${await response.text()}`);

        const results = await response.json();
        if (!results.success) {
            setLoginStatus("failure");
            return
        }

        setLoginStatus("success");
        setAuthToken(results.JWT, results.uid)
    } catch (error) {
        setLoginStatus("failure");
        console.error(error);
    }
}

const Register = ({ formData, setFormData }) => {

    const [geolocation, setGeolocation] = useState(null);
    const locate = useEffect(() => {
        getLocation(setGeolocation);
    }, []);

    return <div><div className="mt-1">

        <label id="email" >Email: </label>
        <input type="email" required id="email" onChange={(e) => setFormData({ ...formData, email: e.target.value, })} />
    </div>
        <div className="mt-1">

            <label id="username">Username: </label>
            <input type="text" required id="username" onChange={(e) => setFormData({ ...formData, username: e.target.value, })} />
        </div>
        <div className="mt-1">

            <label id="city" >City: </label>
            <input type="text" required id="city" onChange={(e) => setFormData({ ...formData, location: e.target.value, })} defaultValue={geolocation ? `${geolocation.city}` : ''} />

            <label id="state" >State: </label>
            <input type="text" required id="state" onChange={(e) => setFormData({ ...formData, location: e.target.value, })} defaultValue={geolocation ? `${geolocation.state}` : ''} />

            <label id="country" >Country: </label>
            <input type="text" id="state" onChange={(e) => setFormData({ ...formData, location: e.target.value, })} defaultValue={geolocation ? `${geolocation.country}` : ''} />

        </div>
        <div className="mt-1">

            <label id="pass">Password: </label>
            <input type="password" required id="pass" onChange={(e) => setFormData({ ...formData, password: e.target.value, })} />
        </div>
    </div>

}
const Login = ({ formData, setFormData }) => {

    return <div>
        <div className="mt-1">

            <label id="email" >Email: </label>
            <input type="email" id="email" onChange={(e) => setFormData({ ...formData, email: e.target.value, })} />
        </div>
        <div className="mt-1">

            <label id="pass">Password: </label>
            <input type="password" id="pass" onChange={(e) => setFormData({ ...formData, password: e.target.value, })} />
        </div>
    </div>

}

async function checkAlreadyLoggedIn() {
    try {

        const authCheck = await fetch(`${apiURL}/auth`, {
            headers: { Authorization: "Bearer " + getAuthToken().JWT }
        });
        console.log('checking authentiction : ' + authCheck.ok)
        // if already authorized, redirect to homepage.
        // you must logout first to switch users.
        if (authCheck.status == 401) {
            console.log("not already logged in");
        } else if (authCheck.status == 200) {
            console.log("yes already logged in");
            window.location.href = "/home";
        }
    } catch (err) {
        console.error("AUTHENTICATION ERROR:", err)
    }
}

export const Auth = () => {

    useEffect(() => {
        checkAlreadyLoggedIn();
        console.log("EFFECT USED");
    }, []);

    const [regOrLogin, setRegOrLogin] = useState("login");
    const [loginStatus, setLoginStatus] = useState('');
    const [sessionTok, setSessionTok] = useState(null);
    const [formData, setFormData] = useState(
        {
            email: '',
            username: '',
            city: '',
            state: '',
            country: '',
            password: '',
        }
    );

    // this saves the session authorization and the constant dictates where to redirect to.
    // this could be used to allow logging in to any page, right now it defaults to home
    const beginSession = useEffect(() => {
        if (loginStatus === "success") {
            window.location.href = "/home";
        }
    }, [loginStatus]);

    return <div className="Form">

        {regOrLogin === "login" ? (<div>Don't have an account? <a className="cursor-pointer underline" onClick={() => setRegOrLogin("register")}>Register instead</a></div>) : (<div>Already have an account? <a className="cursor-pointer underline" onClick={() => setRegOrLogin("login")}>Login instead</a></div>)}
        <div>Don't want to create an account? <a className="underline" href="/home">Browse your local Grassroots</a></div>

        <div>
            {regOrLogin === "login" ? <Login formData={formData} setFormData={setFormData} /> : <Register formData={formData} setFormData={setFormData} />}

            {statusBit(loginStatus)}

            <button onClick={() => loginUser(regOrLogin, formData, setLoginStatus, setSessionTok)}>{regOrLogin === "login" ? "Login" : "Register"}</button>

        </div>
    </div>
}

const statusBit = (loginStatus) => {
    switch (loginStatus) {
        case "failure":
            return <div>Incorrect username or password.</div>
            break;
        case "error":
            return <div>Something went wrong. Please try again.</div>
        default:
            break;
    }
}