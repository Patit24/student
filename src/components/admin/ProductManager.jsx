import React, { useState, useEffect } from 'react';
import { 
  Package, Zap, Upload, DollarSign, Image as ImageIcon, 
  Trash2, Plus, Box, Edit3, X
} from 'lucide-react';
import { 
  createMarketplaceProduct, 
  subscribeMarketplaceProducts, 
  uploadFileToStorage, 
  updateMarketplaceProduct 
} from '../../db.service';
import { useToast } from '../Toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ProductManager() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [productType, setProductType] = useState('Digital');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState([]);
  const [fileUrl, setFileUrl] = useState('');
  const [category, setCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const unsub = subscribeMarketplaceProducts(setProducts);
    return () => unsub();
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsUploading(true);
    try {
      const urls = await Promise.all(
        files.map(file => uploadFileToStorage(file, 'product_images', setUploadProgress))
      );
      setImages(prev => [...prev, ...urls]);
      toast.success('Images uploaded successfully');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDigitalFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFileToStorage(file, 'digital_products', setUploadProgress);
      setFileUrl(url);
      toast.success('Product file uploaded successfully');
    } catch (err) {
      toast.error('File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !originalPrice || !category) {
      toast.error('Title, Original Price, and Category are required');
      return;
    }

    if (productType === 'Digital' && !fileUrl) {
      toast.error('Please upload the digital file for this product');
      return;
    }

    const productData = {
      type: productType,
      title,
      category: category.trim(),
      description,
      originalPrice: parseFloat(originalPrice),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      images,
      metadata: productType === 'Digital' ? {
        downloadUrl: fileUrl,
        format: 'Digital Download'
      } : {
        stock: parseInt(stock) || 0,
        weight: '0.5kg'
      }
    };

    try {
      if (editingProduct) {
        await updateMarketplaceProduct(editingProduct.id, productData);
        toast.success('Product Updated! ✨');
      } else {
        await createMarketplaceProduct(productData);
        toast.success(`${productType} Product Added! ✅`);
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      toast.error('Failed to save product: ' + err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setOriginalPrice('');
    setSalePrice('');
    setStock('');
    setImages([]);
    setFileUrl('');
    setEditingProduct(null);
  };

  const handleEditClick = (p) => {
    setEditingProduct(p);
    setProductType(p.type);
    setTitle(p.title);
    setCategory(p.category || '');
    setDescription(p.description || '');
    setOriginalPrice(p.originalPrice);
    setSalePrice(p.salePrice || '');
    setImages(p.images || []);
    if (p.type === 'Digital') {
      setFileUrl(p.metadata?.downloadUrl || '');
    } else {
      setStock(p.metadata?.stock || '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    }
  };

  return (
    <div className="flex-col gap-8 animate-premium">
      <div className="flex gap-4 mb-4">
        <button 
          className={`tab-btn ${productType === 'Digital' ? 'active' : ''}`} 
          onClick={() => setProductType('Digital')}
          style={{ 
            background: productType === 'Digital' ? 'rgba(99,102,241,0.12)' : '', 
            borderColor: productType === 'Digital' ? '#6366F1' : '', 
            color: productType === 'Digital' ? '#818CF8' : '' 
          }}
        >
          <Zap size={16} /> Digital Product
        </button>
        <button 
          className={`tab-btn ${productType === 'Physical' ? 'active' : ''}`} 
          onClick={() => setProductType('Physical')}
          style={{ 
            background: productType === 'Physical' ? 'rgba(245,158,11,0.12)' : '', 
            borderColor: productType === 'Physical' ? '#F59E0B' : '', 
            color: productType === 'Physical' ? '#FBBF24' : '' 
          }}
        >
          <Box size={16} /> Physical Product
        </button>
      </div>

      <div className="glass-card p-8" style={{ border: `1px solid ${productType === 'Digital' ? 'rgba(99,102,241,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="flex items-center gap-2" style={{ margin: 0 }}>
            {editingProduct ? (
              <Edit3 size={20} color="#818CF8" />
            ) : (
              <Plus size={20} color={productType === 'Digital' ? '#818CF8' : '#FBBF24'} />
            )}
            {editingProduct ? 'Edit Product' : `Add New ${productType} Product`}
          </h3>
          {editingProduct && (
            <button className="btn-icon" onClick={resetForm} title="Cancel Edit">
              <X size={18} />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="input-group">
            <label className="input-label">Product Title</label>
            <input className="input-field w-full" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label">Category (e.g. Books, Kits, Notes)</label>
            <input className="input-field w-full" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Test Series" />
          </div>
          
          <div className="input-group md:col-span-2">
            <label className="input-label">Description</label>
            <textarea className="input-field w-full" value={description} onChange={e => setDescription(e.target.value)} rows="2" />
          </div>

          <div className="flex gap-4">
            <div className="input-group flex-1">
              <label className="input-label flex items-center gap-1"><DollarSign size={14}/> Original Price (₹)</label>
              <input type="number" className="input-field w-full" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} required />
            </div>
            <div className="input-group flex-1">
              <label className="input-label flex items-center gap-1"><DollarSign size={14}/> Sale Price (₹) [Optional]</label>
              <input type="number" className="input-field w-full" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
            </div>
          </div>

          {productType === 'Physical' ? (
            <div className="input-group">
              <label className="input-label flex items-center gap-1"><Package size={14}/> Stock Quantity</label>
              <input type="number" className="input-field w-full" value={stock} onChange={e => setStock(e.target.value)} required />
            </div>
          ) : (
            <div className="input-group">
              <label className="input-label flex items-center gap-1"><Upload size={14}/> Upload Source File (PDF/Video)</label>
              <div className="flex items-center gap-4">
                <input type="file" id="digital-file-upload" hidden onChange={handleDigitalFileUpload} />
                <label htmlFor="digital-file-upload" className="btn-approve flex items-center gap-2 cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px dashed rgba(255,255,255,0.2)' }}>
                  <Upload size={16} /> Choose File
                </label>
                {fileUrl && <span style={{ color: '#10B981', fontSize: '0.85rem' }}>✓ File Ready</span>}
              </div>
            </div>
          )}

          <div className="input-group md:col-span-2">
            <label className="input-label flex items-center gap-1"><ImageIcon size={14}/> Product Images</label>
            <div className="flex gap-4 items-center">
              <input type="file" id="image-upload" multiple hidden accept="image/*" onChange={handleImageUpload} />
              <label htmlFor="image-upload" className="btn-approve flex items-center gap-2 cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <ImageIcon size={16} /> Upload Photos
              </label>
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <img key={i} src={img} alt="preview" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 mt-4">
            <button type="submit" className="btn-approve w-full" style={{ padding: '0.8rem', background: editingProduct ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : (productType === 'Digital' ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'), border: 'none', fontWeight: 'bold' }}>
              {editingProduct ? 'Update Product' : 'Publish Product'}
            </button>
            {isUploading && <div className="mt-4"><div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}><div style={{ width: `${uploadProgress}%`, height: '100%', background: '#10B981', transition: 'width 0.3s' }} /></div></div>}
          </div>
        </form>
      </div>

      <div className="glass-card p-8">
        <h4 className="mb-4" style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📦 Active Marketplace Products ({products.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p.id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
              <div className="flex items-center gap-4">
                <img src={p.images?.[0] || 'https://via.placeholder.com/50'} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#F0F4FF', fontSize: '1rem' }}>{p.title}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#7A8BA8' }}>
                    {p.type} • ₹{p.salePrice || p.originalPrice} 
                    {p.type === 'Physical' && ` • Stock: ${p.metadata?.stock}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-icon" onClick={() => handleEditClick(p)} title="Edit"><Edit3 size={16} /></button>
                <button className="btn-icon" onClick={() => handleDeleteProduct(p.id)} title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
