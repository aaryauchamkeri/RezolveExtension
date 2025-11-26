import { useState } from 'react';
import styles from './login.module.css';

function checkLoggedIn() {
    let cookies = document.cookie.split(";");
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split("=");

        if (key === "rezolve") {
            const date = new Date(value);
            return true;
        }
    }
    return false;
}


export default function Login({ setLoggedIn }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    if (checkLoggedIn()) {
        setLoggedIn(true);
    }

    const signIn = async () => {
        let response = await fetch('https://rezolvebackend.onrender.com/login', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": username,
                "password": password
            })
        });
        if (response.status === 200) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 10);
            document.cookie = "rezolve=" + encodeURIComponent(expiry.toISOString()) +
                "; Expires=" + expiry.toUTCString() +
                "; Path=/";
            setLoggedIn(true);
        }
    };

    return (
        <div className={styles.parent}>
            <div className={styles.logo_container}>
                <img src='./rezolve_logo_text.png' className={styles.logo}></img>
            </div>
            <div className={styles.login_contents}>
                <input
                    type='text'
                    className={styles.message_box}
                    placeholder='Enter username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type='password'
                    className={styles.message_box}
                    placeholder='Enter password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <div className={styles.button} onClick={signIn}>
                    <span>Sign in</span>
                </div>
            </div>
        </div>
    );
}
