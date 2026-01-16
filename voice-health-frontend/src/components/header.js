import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <header className="navbar">
            <div className="navbar-content container">
                <div className="navbar-brand">Voice Health Detection</div>
                <nav className="navbar-nav">
                    <Link to="/" className="navbar-link">Home</Link>
                    <Link to="/login" className="navbar-link">Login</Link>
                    <Link to="/profile" className="navbar-link">Profile</Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;