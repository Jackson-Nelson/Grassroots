import React, { useState } from "react";
import emailInput from "./assets/email-input.png";
import passInput from "./assets/pass-input.png";
import userInput from "./assets/user-input.png";
import { useEffect } from "react";
import getLocale from '../utils/getcoords.js'
import { getAuthToken } from "../App.js";


const apiURL = 'http://localhost:4000/api'

// this is the only place auth token should be set, so it is not exported
const setAuthToken = (tok, userId) => {
    localStorage.setItem("auth", tok);
    localStorage.setItem("uid", userId);
}


const Register = ({ formData, setFormData }) => {

    const [geolocation, setGeolocation] = useState(null);

    useEffect(() => {
        getLocale(setGeolocation);
    }, []);

    // update form values when geolocation comes in
    useEffect(() => {
        if (geolocation)
            setFormData({ ...formData, city: geolocation.city, state: geolocation.state, country: geolocation.country });
    }, [geolocation]);

    return <div>
        <div className="mt-1">

            <label id="email" >Email: </label>
            <input type="email" required id="email" onChange={(e) => setFormData({ ...formData, email: e.target.value, })} />
        </div>
        <div className="mt-1">

            <label id="username">Username: </label>
            <input type="text" required id="username" onChange={(e) => setFormData({ ...formData, username: e.target.value, })} />
        </div>
        <div className="mt-1">

            <label id="city" >City: </label>
            <input type="text" required id="city" onChange={(e) => setFormData({ ...formData, city: e.target.value, })} defaultValue={geolocation ? `${geolocation.city}` : ''} />

            <label id="state" >State: </label>
            <input type="text" required id="state" onChange={(e) => setFormData({ ...formData, state: e.target.value, })} defaultValue={geolocation ? `${geolocation.state}` : ''} />

            <label id="country" >Country: </label>
            <input type="text" id="state" onChange={(e) => setFormData({ ...formData, country: e.target.value, })} defaultValue={geolocation ? `${geolocation.country}` : ''} />

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


export const Auth = () => {

    const [loginOrRegister, setRegOrLogin] = useState("login");
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





    const loginUser = async () => {

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



    async function checkAlreadyLoggedIn() {
        try {

            const response = await fetch(`${apiURL}/auth`, {
                headers: { Authorization: "Bearer " + getAuthToken().JWT }
            });
            console.log('checking authentiction : ' + response.ok)
            // if already authorized, redirect to homepage.
            // you must logout first to switch users.
            if (response.status == 401) {
                console.log("not already logged in");
            } else if (response.status == 200) {
                console.log("yes already logged in");
                window.location.href = "/home";
            }
        } catch (err) {
            console.error("AUTHENTICATION ERROR:", err)
        }
    }


    useEffect(() => {
        checkAlreadyLoggedIn();
        console.log("EFFECT USED");
    }, []);

    // this saves the session authorization and the constant dictates where to redirect to.
    // this could be used to allow logging in to any page, right now it defaults to home
    useEffect(() => {
        if (loginStatus === "success") {
            window.location.href = "/home";
        }
    }, [loginStatus]);

    return <div className="Form">

        {loginOrRegister === "login" ? (<div>Don't have an account? <a className="cursor-pointer underline" onClick={() => setRegOrLogin("register")}>Register instead</a></div>) : (<div>Already have an account? <a className="cursor-pointer underline" onClick={() => setRegOrLogin("login")}>Login instead</a></div>)}
        <div>Don't want to create an account? <a className="underline" href="/home">Browse your local Grassroots</a></div>

        <div>
            {loginOrRegister === "login" ? <Login formData={formData} setFormData={setFormData} /> : <Register formData={formData} setFormData={setFormData} />}

            {statusBit(loginStatus)}

            <button onClick={loginUser}>{loginOrRegister === "login" ? "Login" : "Register"}</button>

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