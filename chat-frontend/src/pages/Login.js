
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Login.css";

const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleLogin = (e) => {

        e.preventDefault();

        setEmailError("");
        setPasswordError("");
        setError("");
        setMessage("");

        if (email === "") {
            setEmailError("Please enter your email");
        }

        if (password === "") {
            setPasswordError("Please enter your password");
        }

        if (email !== "" && password !== "") {

            fetch("http://localhost:5000/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {

                    if (data.token) {

                         sessionStorage.setItem("token", data.token);
                         sessionStorage.setItem("user", JSON.stringify(data.user));

                        setMessage("Login Successful");

                        setTimeout(() => {
                            navigate("/chat",{ replace: true });
                        }, 1500);

                    } else {
                        setError(data.message);
                    }


                    
                })
                .catch((error) => {
                    console.log(error);
                    setError("Something went wrong");
                });
        }
    };

    return (
        <div className="login-page">

            <div className="login-container">

            <h2>Login</h2>

            <form onSubmit={handleLogin}>

                    <div className="login-form-group">

                        <label>Email</label>
                        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        {emailError !== "" && (
                            <p className="error-message">{emailError}</p>
                        )}

                    </div>

                    <div className="login-form-group">

                        <label>Password</label>
                        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                        {passwordError !== "" && (
                            <p className="error-message">{passwordError}</p>
                        )}

                    </div>

                    {error !== "" && (
                        <p className="error-message">{error}</p>
                    )}

                    <p style={{ color: "green" }}>{message}</p>

                    <button type="submit">Login</button>

                    <p className="register-link">
                         Don't have an account?{" "}
                        <span onClick={() => navigate("/register")}> Register </span>   
                    </p>

            </form>

            </div>

        </div>
    );

};

export default Login;
