import React, { useState } from "react";
import emailInput from "./assets/email-input.png"
import passInput from "./assets/pass-input.png"
import userInput from "./assets/user-input.png"


const apiCall = async (endpoint, options) => {
    try {
        return await fetch(`http://localhost:4000/api/${endpoint}`, options).then(
            (resp) => { return resp; },
        ).catch((err) => console.log(err))
    } catch (err) {
        console.log(err)
    }
}

const getLocation = () => {
    if (navigator.geolocation) {
        // get the current users location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                return position.coords;
            },
            // if there was an error getting the users location
            (error) => {
                console.error('Error getting user location:', error);
            }
        );

    }// if geolocation is not supported by the users browser
    else {
        console.error('Geolocation is not supported by this browser.');
    }
};

export const Auth = () => {

    const [doRegister, setDoRegister] = useState(true)
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        location: getLocation(),
    })

    const onsubmit = async (e) => {
        e.preventDefault();

        try {

            const response = await apiCall(`${doRegister ? 'register' : 'login'}`, {
                method: 'POST',
                body: JSON.stringify(formData)
            })

            // what to do on success <>
        } catch (err) {
            console.log(err)
        }
    }


    return (
        <form className="bg-white" onSubmit={onsubmit}>
            <div className="header-container flex">
                <h3 className="text-3xl">Sign In</h3>
                <div>Don't have an account? <span>Sign Up</span></div>
            </div>

            {doRegister && <div className="mb-3">
                <label>Email address</label>
                <input
                    type="email"
                    className="form-control"
                    placeholder="Enter email"
                    onChange={(v) => setFormData({ ...formData, email: v.target.value })}
                    required
                />
            </div>}
            <div className="mb-3">
                <label>Username</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter username"
                    onChange={(v) => setFormData({ ...formData, username: v.target.value })}
                    required
                />
            </div>
            <div className="mb-3">
                <label>Password</label>
                <input
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    onChange={(v) => setFormData({ ...formData, password: v.target.value })}
                    required
                />
            </div>

            {doRegister && <div className="mb-3">
                <label>Location</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter location"
                    defaultValue={formData['location']}
                    onChange={(v) => setFormData({ ...formData, password: v.target.value })}
                    required
                />
            </div>}
            <div className="d-grid">
                <button type="submit" className="btn btn-primary">Submit</button>
            </div>

            <p className="forgot-password text-left">
                Forgot <a href="#">password?</a>
            </p>
        </form>
    );
}