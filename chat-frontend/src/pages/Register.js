
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Register.css";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const navigate=useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();

        setNameError("");
        setEmailError("");
        setPasswordError("");
        setError("");
        setMessage("");

        if (name === "") {
            setNameError("Please enter your name");
        }

        if (email === "") {
            setEmailError("Please enter your email");
        }

        if (password === "") {
            setPasswordError("Please enter your password");
        }

        if (name !== "" && email !== "" && password !== "") {

            fetch("http://localhost:5000/api/user/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: name,
                    email: email,
                    password: password
                })
            })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {

                    if (data.message === "User registered successfully") {

                        setMessage("Registered Successfully");

                        setName("");
                        setEmail("");
                        setPassword("");

                    } else {
                        setError(data.message);
                    }

                })
                .catch((error) => {
                    console.log("Register Error:", error);
                    setError("Something went wrong");
                });
        }
    };

    return (
        <div className="register-page">

            <form onSubmit={handleRegister}>

                <h1 className="register">Register</h1>

                <div className="register-form-group">

                    <label>Name</label>
                    <input type="text" placeholder="Enter your name" value={name} onChange={(e)=>setName(e.target.value)}/>
                    {nameError !== "" && (
                        <p className="error-message">{nameError}</p>
                    )}

                </div>

                <div className="register-form-group">

                    <label>Email</label>
                    <input type="email" placeholder="Enter your email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
                    {emailError !== "" && (
                        <p className="error-message">{emailError}</p>
                    )}

                </div>

                <div className="register-form-group">

                    <label>Password</label>
                    <input type="password" placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
                    {passwordError !== "" && (
                        <p className="error-message">{passwordError}</p>
                    )}
                    
                </div>

                {error !== "" && (
                    <p className="error-message">{error}</p>
                )}

                <p className="success-message">{message}</p>

                <button type="submit">Register</button>

                <p className="login-link">
                    Already have an account?{" "}
                    <span onClick={() => navigate("/login")}>
                        Login
                    </span>
                </p>

            </form>
        
        </div>
    );
}

export default Register;
