import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Phone, MapPin, Users, 
  Send, Camera, Play, 
  ArrowRight, Share2, 
  HelpCircle 
} from 'lucide-react';
import logoImg from '../assets/logopng.png';
import './Footer.css';

const Footer = () => {
  // Safe Fallbacks (Generic icons for brands to ensure build success)
  const FacebookIcon = Users;
  const TwitterIcon = Send;
  const InstagramIcon = Camera;
  const YoutubeIcon = Play;
  const MailIcon = Mail;
  const PhoneIcon = Phone;
  const MapPinIcon = MapPin;
  const ArrowRightIcon = ArrowRight;
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
              <a href="#" className="social-icon"><FacebookIcon size={18} /></a>
              <a href="#" className="social-icon"><TwitterIcon size={18} /></a>
              <a href="#" className="social-icon"><InstagramIcon size={18} /></a>
              <a href="#" className="social-icon"><YoutubeIcon size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-nav">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/"><ArrowRightIcon size={14} /> Home</Link></li>
              <li><Link to="/search"><ArrowRightIcon size={14} /> Find Tutors</Link></li>
              <li><Link to="/about"><ArrowRightIcon size={14} /> About Us</Link></li>
              <li><Link to="/resume-builder"><ArrowRightIcon size={14} /> Resume Builder</Link></li>
              <li><Link to="/pricing"><ArrowRightIcon size={14} /> Pricing</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <div className="contact-item">
              <MailIcon size={18} />
              <span>support@ppreducation.in</span>
            </div>
            <div className="contact-item">
              <PhoneIcon size={18} />
              <span>+91 9014842370</span>
            </div>
            <div className="contact-item">
              <MapPinIcon size={18} />
              <span>Kolkata, West Bengal, India</span>
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
