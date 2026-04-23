import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
const { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, ArrowRight } = Icons;
import logoImg from '../assets/logopng.png';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-root">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <img src={logoImg} alt="PPREducation Logo" className="footer-logo" />
            <p className="footer-tagline">
              Empowering tutors and students with cutting-edge technology for seamless learning experiences. 
              Join PPREducation today and transform your educational journey.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon"><Facebook size={18} /></a>
              <a href="#" className="social-icon"><Twitter size={18} /></a>
              <a href="#" className="social-icon"><Instagram size={18} /></a>
              <a href="#" className="social-icon"><Youtube size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-nav">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/"><ArrowRight size={14} /> Home</Link></li>
              <li><Link to="/search"><ArrowRight size={14} /> Find Tutors</Link></li>
              <li><Link to="/about"><ArrowRight size={14} /> About Us</Link></li>
              <li><Link to="/resume-builder"><ArrowRight size={14} /> Resume Builder</Link></li>
              <li><Link to="/pricing"><ArrowRight size={14} /> Pricing</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <div className="contact-item">
              <Mail size={18} />
              <span>support@ppreducation.in</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>+91 9014842370</span>
            </div>
            <div className="contact-item">
              <MapPin size={18} />
              <span>Noida, Uttar Pradesh, India</span>
            </div>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <h4>Stay Updated</h4>
            <p>Subscribe to our newsletter for the latest updates and educational tips.</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Your Email" />
              <button className="btn btn-primary">Join</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} PPREducation. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
