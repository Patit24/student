import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

export default function ProductCarousel({ title, products, subtitle }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth 
        : scrollLeft + clientWidth;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="product-carousel-wrapper">
      <div className="carousel-header">
        <div className="carousel-titles">
          <h2 className="carousel-title">{title}</h2>
          {subtitle && <p className="carousel-subtitle">{subtitle}</p>}
        </div>
        <div className="carousel-controls">
          <button className="carousel-control-btn" onClick={() => scroll('left')}>
            <ChevronLeft size={24} />
          </button>
          <button className="carousel-control-btn" onClick={() => scroll('right')}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="carousel-container" ref={scrollRef}>
        {products.map((product) => (
          <div key={product.id} className="carousel-item">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
