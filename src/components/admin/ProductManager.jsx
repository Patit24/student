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

  // Beauty Specific Fields
  const [brand, setBrand] = useState('');
  const [shades, setShades] = useState([]); // [{name, hex}]
  const [shadeName, setShadeName] = useState('');
  const [shadeHex, setShadeHex] = useState('#000000');
  const [size, setSize] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [brandStory, setBrandStory] = useState('');
  const [superIngredients, setSuperIngredients] = useState([]);
  const [superIngInput, setSuperIngInput] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');

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
        weight: '0.5kg'
      } : productType === 'Beauty' ? {
        brand,
        shades,
        size,
        ingredients,
        superIngredients,
        howToUse,
        brandStory,
        manufacturer,
        countryOfOrigin,
        stock: parseInt(stock) || 0
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
    setBrand('');
    setShades([]);
    setSize('');
    setIngredients('');
    setSuperIngredients([]);
    setHowToUse('');
    setBrandStory('');
    setManufacturer('');
    setCountryOfOrigin('');
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
    } else if (p.type === 'Beauty') {
      setBrand(p.metadata?.brand || '');
      setShades(p.metadata?.shades || []);
      setSize(p.metadata?.size || '');
      setIngredients(p.metadata?.ingredients || '');
      setSuperIngredients(p.metadata?.superIngredients || []);
      setHowToUse(p.metadata?.howToUse || '');
      setBrandStory(p.metadata?.brandStory || '');
      setManufacturer(p.metadata?.manufacturer || '');
      setCountryOfOrigin(p.metadata?.countryOfOrigin || '');
      setStock(p.metadata?.stock || '');
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
        <button 
          className={`tab-btn ${productType === 'Beauty' ? 'active' : ''}`} 
          onClick={() => setProductType('Beauty')}
          style={{ 
            background: productType === 'Beauty' ? 'rgba(236,72,153,0.12)' : '', 
            borderColor: productType === 'Beauty' ? '#EC4899' : '', 
            color: productType === 'Beauty' ? '#F472B6' : '' 
          }}
        >
          <Star size={16} /> Beauty Product
        </button>
      </div>

      <div className="glass-card p-8" style={{ border: `1px solid ${productType === 'Digital' ? 'rgba(99,102,241,0.25)' : productType === 'Beauty' ? 'rgba(236,72,153,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
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
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <div className="input-group">
            <label className="input-label">Product Title</label>
            <input className="input-field w-full" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label">Category (e.g. Books, Kits, Notes)</label>
            <input className="input-field w-full" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Test Series" />
          </div>
          
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
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

          {productType === 'Physical' || productType === 'Beauty' ? (
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

          {productType === 'Beauty' && (
            <>
              <div className="input-group">
                <label className="input-label">Brand Name</label>
                <input className="input-field w-full" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Rom&nd" />
              </div>
              <div className="input-group">
                <label className="input-label">Size / Volume</label>
                <input className="input-field w-full" value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 3.5 g" />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Manage Shades/Colors</label>
                <div className="flex gap-2 mb-2">
                  <input className="input-field flex-1" placeholder="Shade Name" value={shadeName} onChange={e => setShadeName(e.target.value)} />
                  <input type="color" className="w-12 h-10 border-none bg-transparent cursor-pointer" value={shadeHex} onChange={e => setShadeHex(e.target.value)} />
                  <button type="button" className="btn-approve px-4" onClick={() => {
                    if (shadeName) {
                      setShades([...shades, { name: shadeName, hex: shadeHex }]);
                      setShadeName('');
                    }
                  }}>Add</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {shades.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] p-2 rounded-lg border border-[rgba(255,255,255,0.1)]">
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: s.hex }} />
                      <span className="text-xs">{s.name}</span>
                      <button type="button" onClick={() => setShades(shades.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Super Ingredients (Enter to add)</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    className="input-field flex-1" 
                    value={superIngInput} 
                    onChange={e => setSuperIngInput(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (superIngInput) {
                          setSuperIngredients([...superIngredients, superIngInput]);
                          setSuperIngInput('');
                        }
                      }
                    }}
                  />
                  <button type="button" className="btn-approve px-4" onClick={() => {
                    if (superIngInput) {
                      setSuperIngredients([...superIngredients, superIngInput]);
                      setSuperIngInput('');
                    }
                  }}>Add</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {superIngredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2 bg-pink-900/20 px-3 py-1 rounded-full border border-pink-500/30">
                      <span className="text-xs text-pink-300">{ing}</span>
                      <button type="button" onClick={() => setSuperIngredients(superIngredients.filter((_, idx) => idx !== i))} className="text-pink-500 hover:text-pink-400"><X size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Ingredients Description</label>
                <textarea className="input-field w-full" value={ingredients} onChange={e => setIngredients(e.target.value)} rows="2" placeholder="Detailed list of ingredients..." />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">How to Use</label>
                <textarea className="input-field w-full" value={howToUse} onChange={e => setHowToUse(e.target.value)} rows="2" />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Brand Story</label>
                <textarea className="input-field w-full" value={brandStory} onChange={e => setBrandStory(e.target.value)} rows="2" placeholder="Tell the brand's history..." />
              </div>
              <div className="input-group">
                <label className="input-label">Manufacturer</label>
                <input className="input-field w-full" value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Country of Origin</label>
                <input className="input-field w-full" value={countryOfOrigin} onChange={e => setCountryOfOrigin(e.target.value)} />
              </div>
            </>
          )}

          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label flex items-center gap-1"><ImageIcon size={14}/> Product Images</label>
            <div className="flex gap-4 items-center mobile-stack">
              <input type="file" id="image-upload" multiple hidden accept="image/*" onChange={handleImageUpload} />
              <label htmlFor="image-upload" className="btn-approve flex items-center gap-2 cursor-pointer mobile-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <ImageIcon size={16} /> Upload Photos
              </label>
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <img key={i} src={img} alt="preview" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }} className="mt-4">
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
            <div key={p.id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'var(--admin-card-hover)', border: '1px solid var(--admin-border)', borderRadius: '12px' }}>
              <div className="flex items-center gap-4">
                <img src={p.images?.[0] || 'https://via.placeholder.com/50'} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--admin-text-primary)', fontSize: '1rem' }}>{p.title}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
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
