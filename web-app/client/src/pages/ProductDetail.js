import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getProductById, 
  getProducts, 
  getWishlist,
  toggleWishlist,
  getProductQuestions,
  askQuestion,
  answerQuestion,
  deleteQuestion
} from '../services/api';
import { isAuthenticated, getAuthData } from '../util/auth';
import useToast from '../hooks/useToast';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState('weekly');
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState({});
  const [showAnswerForm, setShowAnswerForm] = useState({});
  const [qaLoading, setQaLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { showSuccessToast, showErrorToast } = useToast();
  const { socket } = useSocket();

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);
  const { isDarkMode } = useTheme();

  // Handle image modal zoom
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoomLevel(1);

  // Construct product images array
  const productImages = React.useMemo(() => {
    if (!product) return [];
    const images = [];
    if (product.image) images.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images.filter(img => img && img !== product.image));
    }
    console.log('Product images:', images);
    return images;
  }, [product]);

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchSimilarProducts();
      fetchQuestions();
      syncWishlistState();
    }
  }, [product]);

  useEffect(() => {
    if (!socket || !id) return undefined;

    const applyStockUpdates = (payload) => {
      const updates = Array.isArray(payload?.updates) ? payload.updates : [];
      const stockMap = new Map(updates.map((item) => [String(item.productId), Number(item.stock)]));
      const ownUpdate = updates.find((item) => String(item.productId) === String(id));
      if (!ownUpdate) return;

      setProduct((prev) => (prev ? { ...prev, stock: Number(ownUpdate.stock) } : prev));
      setRelatedProducts((prev) =>
        prev.map((p) => (stockMap.has(String(p._id)) ? { ...p, stock: stockMap.get(String(p._id)) } : p))
      );
      setSimilarProducts((prev) =>
        prev.map((p) => (stockMap.has(String(p._id)) ? { ...p, stock: stockMap.get(String(p._id)) } : p))
      );
    };

    socket.on('productsStockUpdated', applyStockUpdates);
    return () => {
      socket.off('productsStockUpdated', applyStockUpdates);
    };
  }, [socket, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await getProductById(id);
      setProduct(res.data);
      if (res.data.images && res.data.images.length > 0) {
        setSelectedImage(0);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showErrorToast('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const res = await getProducts();
      setRelatedProducts(res.data.products.filter(p => p._id !== id).slice(0, 4));
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      const res = await getProducts('', '', 1);
      setSimilarProducts(res.data.products.filter(p => p.category === product?.category && p._id !== id).slice(0, 6));
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await getProductQuestions(id);
      console.log('Fetched questions:', res.data);
      setQuestions(res.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    console.log('Submitting question...');
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (!newQuestion.trim()) {
      showErrorToast('Please enter a question');
      return;
    }
    
    const tempQuestion = {
      _id: 'temp-' + Date.now(),
      question: newQuestion.trim(),
      name: 'You',
      user: { name: 'You' },
      createdAt: new Date().toISOString(),
      answers: [],
      isAnswered: false
    };
    
    // Instantly show question in list
    setQuestions(prev => [tempQuestion, ...prev]);
    const questionText = newQuestion;
    setNewQuestion('');
    setQaLoading(true);
    
    try {
      console.log('Calling askQuestion API with:', id, questionText);
      const res = await askQuestion(id, questionText);
      console.log('Question submitted successfully:', res.data);
      
      // Replace temp question with real one from server
      setQuestions(prev => prev.map(q => 
        q._id === tempQuestion._id ? res.data : q
      ));
      showSuccessToast('Question submitted successfully!');
    } catch (error) {
      console.error('Error asking question:', error);
      // Remove temp question on error
      setQuestions(prev => prev.filter(q => q._id !== tempQuestion._id));
      setNewQuestion(questionText);
      showErrorToast('Failed to submit question');
    } finally {
      setQaLoading(false);
    }
  };

  const handleAnswerQuestion = async (questionId) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    const answer = answerText[questionId];
    if (!answer || !answer.trim()) {
      showErrorToast('Please enter an answer');
      return;
    }
    
    const tempAnswer = {
      _id: 'temp-answer-' + Date.now(),
      answer: answer.trim(),
      name: 'You',
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    
    // Instantly add answer to the question
    setQuestions(prev => prev.map(q => 
      q._id === questionId 
        ? { ...q, answers: [...(q.answers || []), tempAnswer], isAnswered: true }
        : q
    ));
    
    setAnswerText({ ...answerText, [questionId]: '' });
    setShowAnswerForm({ ...showAnswerForm, [questionId]: false });
    setQaLoading(true);
    
    try {
      const res = await answerQuestion(questionId, answer);
      // Replace with server data
      setQuestions(prev => prev.map(q => 
        q._id === questionId ? res.data : q
      ));
      showSuccessToast('Answer submitted successfully!');
    } catch (error) {
      console.error('Error answering question:', error);
      // Remove temp answer on error
      setQuestions(prev => prev.map(q => 
        q._id === questionId 
          ? { ...q, answers: q.answers.filter(a => a._id !== tempAnswer._id) }
          : q
      ));
      showErrorToast('Failed to submit answer');
    } finally {
      setQaLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion(questionId);
      showSuccessToast('Question deleted successfully!');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      showErrorToast('Failed to delete question');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (product.stock === 0) {
      showErrorToast('Product is out of stock');
      return;
    }

    const checkoutItem = {
      _id: `buy-now-${product._id}`,
      product: product._id,
      name: product.name,
      image: product.image || '',
      category: product.category || '',
      price: Number(product.price || 0),
      quantity
    };

    sessionStorage.setItem('selectedItems', JSON.stringify([checkoutItem]));
    navigate('/checkout');
  };

  const syncWishlistState = async () => {
    if (!product?._id || !isAuthenticated()) {
      setIsWishlisted(false);
      return;
    }
    try {
      const res = await getWishlist();
      const data = res?.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.wishlist)
            ? data.wishlist
            : [];
      const found = items.some((item) => {
        const itemProductId =
          typeof item === 'string'
            ? item
            : typeof item?.product === 'string'
              ? item.product
              : item?.product?._id || item?._id;
        return String(itemProductId) === String(product._id);
      });
      setIsWishlisted(found);
    } catch (error) {
      setIsWishlisted(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    try {
      setWishlistLoading(true);
      await toggleWishlist(product._id);
      const next = !isWishlisted;
      setIsWishlisted(next);
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId: String(product._id), isWishlisted: next }
        })
      );
      showSuccessToast(next ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (error) {
      console.error('Wishlist error:', error);
      showErrorToast('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = (platform) => {
    const shareUrl = window.location.href;
    const shareText = `Check out ${product.name} on Pinqoza!`;
    let url = '';

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        showSuccessToast('Link copied to clipboard!');
        setShowShareModal(false);
        return;
      default:
        return;
    }
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    // Subscription logic would go here
    showSuccessToast(`Subscription created for ${subscriptionFrequency} delivery!`);
    setShowSubscriptionModal(false);
  };

  const getBulkDiscount = (qty) => {
    if (qty >= 10) return 0.15; // 15% discount for 10+ items
    if (qty >= 5) return 0.10; // 10% discount for 5+ items
    if (qty >= 3) return 0.05; // 5% discount for 3+ items
    return 0;
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      milk: '🥛',
      ghee: '🍯',
      cheese: '🧀',
      butter: '🧈',
      curd: '🥣',
      paneer: '🧊',
      cream: '🍦',
      yogurt: '🍶',
      lassi: '🥤',
      buttermilk: '🫙',
      sweets: '🍬',
      cake: '🍰'
    };
    return emojis[category] || '🥛';
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      milk: 'from-blue-200 to-blue-400 dark:from-blue-600 dark:to-blue-800',
      ghee: 'from-amber-200 to-amber-400 dark:from-amber-600 dark:to-amber-800',
      cheese: 'from-yellow-200 to-yellow-400 dark:from-yellow-600 dark:to-yellow-800',
      butter: 'from-orange-200 to-orange-400 dark:from-orange-600 dark:to-orange-800',
      curd: 'from-green-200 to-green-400 dark:from-green-600 dark:to-green-800',
      paneer: 'from-purple-200 to-purple-400 dark:from-purple-600 dark:to-purple-800',
      cream: 'from-pink-200 to-pink-400 dark:from-pink-600 dark:to-pink-800',
      yogurt: 'from-teal-200 to-teal-400 dark:from-teal-600 dark:to-teal-800',
      lassi: 'from-cyan-200 to-cyan-400 dark:from-cyan-600 dark:to-cyan-800',
      buttermilk: 'from-lime-200 to-lime-400 dark:from-lime-600 dark:to-lime-800',
      sweets: 'from-rose-200 to-pink-300 dark:from-rose-600 dark:to-pink-800',
      cake: 'from-fuchsia-200 to-pink-400 dark:from-fuchsia-600 dark:to-pink-800'
    };
    return gradients[category] || 'from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800';
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-gray-300">★</span>);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Product not found</h2>
          <Link to="/products" className="text-primary-600 hover:text-primary-700">Back to Products</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-primary-600 hover:text-primary-700">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link to="/products" className="text-primary-600 hover:text-primary-700">Products</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-600 dark:text-gray-300">{product.name}</li>
          </ol>
        </nav>

        {/* Main Product Section - Modern Glassmorphism */}
        <div className={`relative rounded-3xl p-8 shadow-2xl mb-8 overflow-hidden ${isDarkMode ? 'bg-gray-800/40 backdrop-blur-2xl border border-white/10' : 'bg-white/60 backdrop-blur-2xl border border-white/50'}`}>
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5 animate-pulse"></div>
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-6">
              {/* Main Image - Modern Floating Card */}
              <div 
                className={`relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br ${getCategoryGradient(product.category)} shadow-2xl cursor-zoom-in group hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 border-4 border-white/20 dark:border-white/10`}
                onClick={() => setShowImageModal(true)}
              >
                {productImages && productImages.length > 0 && productImages[selectedImage] ? (
                  <img
                    src={productImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.fallback-emoji').style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="fallback-emoji w-full h-full flex items-center justify-center absolute inset-0" style={{ display: (!productImages || productImages.length === 0 || !productImages[selectedImage]) ? 'flex' : 'none' }}>
                  <span className="text-8xl">{getCategoryEmoji(product.category)}</span>
                </div>
                {/* Zoom hint overlay - Modern Glass Button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/60 transition-all duration-300 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100">
                  <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/30 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-white">Click to Zoom</span>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-white/20">
                  <span className="text-xs font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">🔥 Bestseller</span>
                </div>
                
                {/* Discount Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-lg font-bold text-sm">
                  -15% OFF
                </div>
              </div>
              
              {/* Thumbnail Images - Modern Scrollable */}
              {productImages.length > 1 && (
                <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-3 transition-all duration-300 hover:scale-105 ${
                        selectedImage === idx 
                          ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-lg scale-105' 
                          : 'border-transparent hover:border-primary-300 shadow-md'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Additional Product Info Cards */}
              <div className="space-y-4">
                {/* Quick Info Card - Modern Glassmorphism */}
                <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-white/80 border border-white/50'} shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-lg">Quick Info</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Brand
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">{product.brand || 'Pinqoza'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Shelf Life
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">7-10 days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Storage
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">4°C Refrigerated</span>
                    </div>
                  </div>
                </div>

                {/* Trust Badges - Modern Card Grid */}
                <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-white/80 border border-white/50'} shadow-lg backdrop-blur-sm`}>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">Why Choose Us?</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer`}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">100% Fresh</span>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer`}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Secure</span>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer`}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fast Delivery</span>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer`}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trusted</span>
                    </div>
                  </div>
                </div>

                {/* Product Video Preview */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Product Video
                  </h4>
                  <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 aspect-video flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-red-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Watch product demo</span>
                  </div>
                </div>

                {/* Product Rating Breakdown */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    Rating Breakdown
                  </h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-3">{stars}</span>
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400 rounded-full" 
                            style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 5 : stars === 2 ? 3 : 2}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right">
                          {stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 5 : stars === 2 ? 3 : 2}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Size/Variant Selector */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Available Sizes
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['250ml', '500ml', '1L', '2L', '5L', '10L'].map((size) => (
                      <button
                        key={size}
                        className={`p-2 rounded-lg text-sm font-medium border transition-all ${
                          size === '1L'
                            ? 'border-primary-500 bg-primary-50 dark:bg-gray-800/30 text-primary-700 dark:text-primary-400'
                            : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customers Also Bought */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Frequently Bought Together
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-black/30 dark:to-black/30 flex items-center justify-center text-xl">🍯</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Pure Honey</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">₹149</p>
                      </div>
                      <button className="text-xs bg-primary-100 dark:bg-black/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full">Add</button>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brown-100 to-orange-100 dark:from-black/30 dark:to-black/30 flex items-center justify-center text-xl">🍞</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Whole Wheat Bread</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">₹45</p>
                      </div>
                      <button className="text-xs bg-primary-100 dark:bg-black/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full">Add</button>
                    </div>
                  </div>
                </div>

                {/* Live Chat Support */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Need Help?
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">S</div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Support Team</p>
                      <p className="text-xs text-green-600 dark:text-green-400">● Online now</p>
                    </div>
                    <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors">
                      Chat
                    </button>
                  </div>
                </div>

                {/* Product Comparison - Moved from right side */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Compare Products
                    </h4>
                    <button className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">View All</button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {relatedProducts.slice(0, 3).map((relatedProduct) => (
                      <div key={relatedProduct._id} className={`flex-shrink-0 w-24 p-2 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-white'} cursor-pointer hover:shadow-md transition-shadow`}>
                        <div className="w-full h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-black dark:to-black rounded-lg mb-1 flex items-center justify-center">
                          <span className="text-xl">{getCategoryEmoji(relatedProduct.category)}</span>
                        </div>
                        <h5 className="text-xs font-semibold text-gray-800 dark:text-white truncate">{relatedProduct.name}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">₹{relatedProduct.price}</p>
                      </div>
                    ))}
                    <div className={`flex-shrink-0 w-24 p-2 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'} cursor-pointer hover:border-primary-500 transition-colors flex items-center justify-center`}>
                      <div className="text-center">
                        <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-xs text-gray-500">Add</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Info - Moved from right side */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Delivery Info
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-black/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Express Delivery</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Same day delivery available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-black/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Free Shipping</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">On orders above ₹299</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-black/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Track Order</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Real-time tracking available</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seller Info - Moved from right side */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Seller Info
                  </h4>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                      MM
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Pinqoza Official</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Verified Seller • 4.8★</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-green-100 dark:bg-black/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Fast Delivery</span>
                        <span className="text-xs bg-blue-100 dark:bg-black/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">Top Rated</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Warranty & Returns */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Warranty & Returns
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-black/30">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">7 Days Easy Returns</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-black/30">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Secure Packaging</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-black/30">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">24h Replacement Policy</span>
                    </div>
                  </div>
                </div>

                {/* Product Safety & Quality */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Safety & Quality
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-black/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Lab Tested</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-black/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Fresh Seal</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-black/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Cold Chain</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-black/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Quality Check</span>
                    </div>
                  </div>
                </div>

                {/* Bulk Order Inquiry */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Bulk Order?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Get special discounts on bulk orders for events, offices, or commercial use.</p>
                  <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
                    Request Quote
                  </button>
                </div>

                {/* Gift Options */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    Gift Options
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-primary-500 rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Add Gift Wrap (+₹30)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-primary-500 rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Include Personalized Message</span>
                    </label>
                    <button className="w-full py-2 px-4 border border-pink-300 text-pink-600 rounded-lg font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all mt-2">
                      🎁 Send as Gift
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info - Modern Layout */}
            <div className="space-y-6">
              {/* Top Badge Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Category Badge - Modern Pill */}
                <span className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full bg-gradient-to-r ${getCategoryGradient(product.category)} text-white shadow-lg hover:shadow-xl transition-shadow`}>
                  <span className="text-lg">{getCategoryEmoji(product.category)}</span>
                  <span>{product.category}</span>
                </span>
                
                {/* Stock Badge - Animated Pulse */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                  product.stock > 10 
                    ? 'bg-green-100 text-green-700 dark:bg-black/30 dark:text-green-300' 
                    : product.stock > 0 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-black/30 dark:text-yellow-300'
                      : 'bg-red-100 text-red-700 dark:bg-black/30 dark:text-red-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500 animate-pulse' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                </div>
              </div>

              {/* Product Name - Large Typography */}
              <div>
                <h1 className="text-5xl font-extrabold text-gray-800 dark:text-white capitalize leading-tight bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-black bg-clip-text text-transparent">
                  {product.name}
                </h1>
                {/* Brand Subtitle */}
                {product.brand && (
                  <p className="mt-2 text-lg text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-8 h-px bg-gray-300 dark:bg-black"></span>
                    By <span className="font-semibold text-primary-600 dark:text-primary-400">{product.brand}</span>
                  </p>
                )}
              </div>

              {/* Rating - Modern Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  {renderStars(product.ratings)}
                </div>
                <div className="h-6 w-px bg-gray-300 dark:bg-black"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">{product.ratings || 4.5}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {product.numReviews || 128} verified reviews
                  </span>
                </div>
                <div className="ml-auto">
                  <button className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                    See all reviews →
                  </button>
                </div>
              </div>

              {/* Price - Large Display */}
              <div className="flex items-baseline gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-black/50 dark:to-black/50 border border-primary-100 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-primary-600 dark:text-primary-400 tracking-tight">
                      ₹{product.price}
                    </span>
                    <span className="text-xl text-gray-500 dark:text-gray-400 font-medium">
                      /{product.unit}
                    </span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <span className="inline-block px-3 py-1 bg-red-100 dark:bg-black/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-full">
                    Save 15%
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-through">
                    MRP ₹{(product.price * 1.15).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Quantity Selector - Modern Floating Control */}
              <div className="flex items-center space-x-4">
                <label className="font-bold text-gray-800 dark:text-white text-lg">Quantity</label>
                <div className="flex items-center bg-white dark:bg-black rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all font-bold text-xl"
                  >
                    −
                  </button>
                  <span className="w-16 text-center font-black text-2xl text-gray-800 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500 transition-all font-bold text-xl"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Max {product.stock} per order</span>
              </div>

              {/* Action Buttons - Modern Floating Design */}
              <div className="flex gap-4">
                {/* Buy Now - Primary CTA */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className={`flex-1 relative overflow-hidden flex items-center justify-center gap-3 font-extrabold py-4 px-6 rounded-2xl transform transition-all duration-300 hover:scale-[1.03] shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    product.stock === 0 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:from-amber-400 hover:via-orange-400 hover:to-red-400 shadow-orange-500/30'
                  }`}
                >
                  {product.stock !== 0 && (
                    <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.25)_45%,transparent_70%)] translate-x-[-120%] hover:translate-x-[120%] transition-transform duration-700"></span>
                  )}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-lg">{product.stock === 0 ? 'Out of Stock' : 'Buy Now'}</span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                    isWishlisted
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/30'
                      : 'bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  <svg className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{wishlistLoading ? '...' : isWishlisted ? 'Saved' : 'Save'}</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>
              </div>

              {/* Subscription Option */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">📦 Subscribe & Save</h3>
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    Setup Subscription
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get regular deliveries and save up to 15%!</p>
              </div>

              {/* Bulk Discount Pricing */}
              {quantity > 1 && (
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">💰 Bulk Discount</h3>
                  <div className="space-y-2 text-sm">
                    <div className={`flex justify-between ${quantity >= 3 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      <span>3+ items:</span>
                      <span>5% off</span>
                    </div>
                    <div className={`flex justify-between ${quantity >= 5 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      <span>5+ items:</span>
                      <span>10% off</span>
                    </div>
                    <div className={`flex justify-between ${quantity >= 10 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      <span>10+ items:</span>
                      <span>15% off</span>
                    </div>
                    {getBulkDiscount(quantity) > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          You save: ₹{(product.price * quantity * getBulkDiscount(quantity)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Availability Checker */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">📍 Check Availability</h3>
                  <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                    Change Location
                  </button>
                </div>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Delhi, NCR</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Available for same day delivery</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">In Stock</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Mumbai, Pune</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Next day delivery available</p>
                      </div>
                    </div>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Limited Stock</span>
                  </div>
                  <button className="w-full p-3 rounded-lg border-2 border-dashed border-primary-300 text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    + Check another location
                  </button>
                </div>
              </div>

              {/* Customer Testimonials */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">💬 Customer Reviews</h3>
                  <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                    View All Reviews
                  </button>
                </div>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">R</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Rahul Sharma</p>
                        <div className="flex items-center gap-1">
                          <div className="flex text-yellow-400 text-xs">
                            {'★'.repeat(5)}
                          </div>
                          <span className="text-xs text-gray-500">2 days ago</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Excellent quality milk! Very fresh and taste is amazing. My kids love it!"</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">P</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Priya Patel</p>
                        <div className="flex items-center gap-1">
                          <div className="flex text-yellow-400 text-xs">
                            {'★'.repeat(4)}
                          </div>
                          <span className="text-xs text-gray-500">1 week ago</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Good packaging and timely delivery. Product quality is consistent."</p>
                  </div>
                </div>
              </div>

              {/* Seasonal Offers Banner */}
              <div className={`p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">🔥 Special Offer</h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Limited Time</span>
                </div>
                <p className="text-sm mb-2">Get 20% off on this product + Free delivery!</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs opacity-90">Use code: MILK20</p>
                  <p className="text-xs opacity-90">Ends in 2 days</p>
                </div>
              </div>

              {/* Product Usage Tips */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">💡 Usage Tips</h3>
                  <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                    More Tips
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-sm mt-0.5">•</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Store at 4°C for best freshness</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-sm mt-0.5">•</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Consume within 3-4 days of opening</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-sm mt-0.5">•</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for morning tea/coffee</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-sm mt-0.5">•</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Shake well before use</p>
                  </div>
                </div>
              </div>

              {/* Product Certifications */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">🏆 Certifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-black/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-white">FSSAI</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Food Safety</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-black/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-white">ISO 9001</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Quality Mgmt</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-black/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-white">Organic</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Certified</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-black/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-white">Halal</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Certified</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product FAQ Section */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">❓ Frequently Asked</h3>
                  <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  <details className={`group ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} p-3 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <summary className="font-medium text-gray-800 dark:text-white cursor-pointer list-none flex items-center justify-between">
                      <span className="text-sm">Is this product pasteurized?</span>
                      <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Yes, all our products go through quality checks to ensure safety and reliability.</p>
                  </details>
                  <details className={`group ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} p-3 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <summary className="font-medium text-gray-800 dark:text-white cursor-pointer list-none flex items-center justify-between">
                      <span className="text-sm">Can I freeze this product?</span>
                      <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">We recommend consuming fresh, but it can be frozen for up to 1 month if needed.</p>
                  </details>
                </div>
              </div>

              {/* Social Sharing Options */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">🔗 Share Product</h3>
                <div className="flex gap-3">
                  <button className="flex-1 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-sm font-medium">Facebook</span>
                  </button>
                  <button className="flex-1 p-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.56 1.017a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.127 4.117 4.117 0 0 1-1.89.072 4.181 4.181 0 0 0 3.907 2.907 8.396 8.396 0 0 1-5.197 1.792 11.748 11.748 0 0 0 6.368 1.862c7.634 0 11.8-6.332 11.8-11.8 0-.18-.005-.36-.013-.54a8.358 8.358 0 0 0 2.061-2.127z"/>
                    </svg>
                    <span className="text-sm font-medium">Twitter</span>
                  </button>
                  <button className="flex-1 p-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Product Ingredients List */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">🥛 Ingredients</h3>
                <div className="space-y-2">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-white">Main Ingredients</span>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Fresh Cow Milk</li>
                      <li>• Natural Cream</li>
                      <li>• Essential Nutrients</li>
                    </ul>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-white">Nutritional Values</span>
                      <span className="text-xs text-gray-500">Per 100ml</span>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Protein: 3.2g</li>
                      <li>• Fat: 3.5g</li>
                      <li>• Carbohydrates: 4.8g</li>
                      <li>• Calcium: 120mg</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Product Warranty Information */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">🛡️ Quality Guarantee</h3>
                <div className="space-y-3">
                  <div className={`flex items-start gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-black/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">100% Fresh Guarantee</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">If not fresh, get full refund within 24 hours</p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-black/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Quality Assured</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Lab tested for purity and safety</p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-black/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Fast Replacement</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Quick replacement for any quality issues</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">💳 Payment Options</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`flex items-center justify-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                    </svg>
                  </div>
                  <div className={`flex items-center justify-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 15h2V9H7v6zm4 0h2V9h-2v6zm4 0h2V9h-2v6zM3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                    </svg>
                  </div>
                  <div className={`flex items-center justify-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className={`flex items-center justify-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                  </div>
                  <div className={`flex items-center justify-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                    </svg>
                  </div>
                  <div className={`flex items-center justify-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">Secure payment methods</p>
              </div>

              {/* Product Highlights */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Product Highlights:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Premium quality product
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Fresh and hygienically packed
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Farm to table freshness
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    No preservatives added
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className={`rounded-3xl p-8 shadow-xl mb-8 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'}`}>
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'description'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'specifications'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('nutritional')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'nutritional'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Nutritional Info
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'reviews'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Reviews ({product.numReviews})
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'qa'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Q&A
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'delivery'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Delivery Info
            </button>
            <button
              onClick={() => setActiveTab('return')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'return'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Return Policy
            </button>
          </div>

          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {product.description}
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg`}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${isDarkMode ? 'bg-primary-600/20' : 'bg-primary-100'}`}>
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Product Specifications</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'} group-hover:scale-110 transition-transform`}>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white capitalize ml-13 pl-13">{product.category}</p>
                </div>

                {/* Brand */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'} group-hover:scale-110 transition-transform`}>
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Brand</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{product.brand || 'Pinqoza'}</p>
                </div>

                {/* Unit */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'} group-hover:scale-110 transition-transform`}>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Unit</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{product.unit}</p>
                </div>

                {/* Stock */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'} group-hover:scale-110 transition-transform`}>
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Stock</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{product.stock} units</p>
                </div>

                {/* Shelf Life */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'} group-hover:scale-110 transition-transform`}>
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Shelf Life</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">7-10 days</p>
                </div>

                {/* Storage */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-100'} group-hover:scale-110 transition-transform`}>
                      <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Storage</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">4°C (Refrigerated)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nutritional' && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg`}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Nutritional Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Per 100ml serving</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Energy', value: '60-70 kcal', icon: '🔥', color: 'red' },
                  { label: 'Protein', value: '3.2g', icon: '💪', color: 'blue' },
                  { label: 'Fat', value: '3.5g', icon: '🧈', color: 'yellow' },
                  { label: 'Carbs', value: '4.8g', icon: '🌾', color: 'orange' },
                  { label: 'Calcium', value: '120mg', icon: '🦴', color: 'purple' },
                  { label: 'Vit D', value: '0.5µg', icon: '☀️', color: 'amber' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-xl ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className={`text-sm mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>*Values may vary based on product type</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Rating Breakdown */}
              <div className={`p-6 rounded-2xl mb-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg`}>
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${isDarkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'}`}>
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Rating Breakdown</h3>
                </div>
                <div className="space-y-3 mb-6">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center">
                      <span className={`w-12 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{star} ★</span>
                      <div className="flex-1 mx-4 h-2.5 bg-gray-200 dark:bg-black rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.random() * 60 + 10}%` }}
                        ></div>
                      </div>
                      <span className={`w-12 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{Math.floor(Math.random() * 50 + 5)}</span>
                    </div>
                  ))}
                </div>
                <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-4xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{product.ratings.toFixed(1)}</span>
                        <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>out of 5</span>
                      </div>
                      <div className="flex text-2xl">{renderStars(product.ratings)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map((review, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isDarkMode ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-yellow-400 to-orange-400'} text-white`}>
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{review.name}</span>
                            <div className="flex">{renderStars(review.rating)}</div>
                          </div>
                          <p className={`text-gray-700 dark:text-gray-300 leading-relaxed`}>{review.comment}</p>
                          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className={`text-gray-600 dark:text-gray-400 font-medium`}>No reviews yet</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qa' && (
            <div>
              {/* Ask Question Form */}
              <div className={`p-6 rounded-2xl mb-6 shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isDarkMode ? 'bg-primary-600/20' : 'bg-primary-100'}`}>
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Ask a Question</h3>
                </div>
                <form onSubmit={handleAskQuestion}>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="What would you like to know about this product?"
                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-black text-gray-800 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all resize-none"
                    rows="3"
                    disabled={qaLoading}
                  ></textarea>
                  <div className="flex justify-end mt-4">
                    <button 
                      type="submit"
                      disabled={qaLoading || !newQuestion.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
                    >
                      {qaLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Submit Question
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {console.log('Rendering questions:', questions)}
                {questions && questions.length > 0 ? (
                  questions.map((q) => (
                    <div key={q._id} className={`p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                      {/* Question Header */}
                      <div className="flex items-start gap-4">
                        {/* User Avatar */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isDarkMode ? 'bg-gradient-to-br from-primary-600 to-secondary-600' : 'bg-gradient-to-br from-primary-500 to-secondary-500'} text-white`}>
                          {q.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Question Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-white">{q.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            
                            {/* Modern Delete Button - Only for question owner */}
                            {(() => {
                              const authData = getAuthData();
                              const currentUserId = authData.user?._id;
                              const isOwner = q.user?._id === currentUserId || q.user === currentUserId;
                              return isAuthenticated() && isOwner && (
                                <button
                                  onClick={() => handleDeleteQuestion(q._id)}
                                  className={`group p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                                  title="Delete your question"
                                >
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              );
                            })()}
                          </div>
                          
                          {/* Question Text */}
                          <p className="mt-2 text-gray-800 dark:text-gray-200 leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      {/* Answers Section */}
                      {q.answers && q.answers.length > 0 && (
                        <div className="mt-4 ml-14 space-y-3">
                          {q.answers.map((ans, idx) => (
                            <div key={idx} className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border-l-4 border-green-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${ans.isAdmin ? 'bg-primary-500 text-white' : 'bg-gray-500 text-white'}`}>
                                  {ans.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ans.name}</span>
                                {ans.isAdmin && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 dark:bg-black/30 text-primary-700 dark:text-primary-400 rounded-full">
                                    Admin
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">{new Date(ans.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                {ans.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Answer Button or Form */}
                      {isAuthenticated() && (
                        <div className="mt-4 ml-14">
                          {showAnswerForm[q._id] ? (
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                              <textarea
                                value={answerText[q._id] || ''}
                                onChange={(e) => setAnswerText({ ...answerText, [q._id]: e.target.value })}
                                placeholder="Write your answer..."
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                rows="2"
                                disabled={qaLoading}
                              ></textarea>
                              <div className="flex justify-end gap-2 mt-3">
                                <button
                                  onClick={() => setShowAnswerForm({ ...showAnswerForm, [q._id]: false })}
                                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAnswerQuestion(q._id)}
                                  disabled={qaLoading || !answerText[q._id]?.trim()}
                                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                  {qaLoading ? 'Submitting...' : 'Post Answer'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAnswerForm({ ...showAnswerForm, [q._id]: true })}
                              className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              {q.answers && q.answers.length > 0 ? 'Add another answer' : 'Answer this question'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No questions yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Be the first to ask a question!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg`}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h-2m1 12v2m0 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Delivery Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: '🚚', title: 'Free Delivery', desc: 'Free delivery on orders above ₹500', color: 'green' },
                  { icon: '⏰', title: 'Delivery Time', desc: 'Same day before 2 PM, next day after', color: 'blue' },
                  { icon: '📍', title: 'Delivery Areas', desc: 'Select cities, check at checkout', color: 'purple' },
                  { icon: '❄️', title: 'Cold Chain', desc: 'Temperature-controlled for freshness', color: 'cyan' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.title}</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'return' && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg`}>
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Return Policy</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: '✅', title: 'Easy Returns', desc: 'Return within 24 hours if damaged/spoiled', color: 'green' },
                  { icon: '💰', title: 'Full Refund', desc: 'Full refund or replacement for eligible returns', color: 'emerald' },
                  { icon: '📞', title: 'Contact Support', desc: 'Call helpline or email for return requests', color: 'blue' },
                  { icon: '📋', title: 'Conditions', desc: 'Unopened, original packaging, quality issues only', color: 'orange' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-md group`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.title}</h4>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Similar Products by Category */}
        {similarProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Similar {product.category} Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {similarProducts.map((similarProduct) => (
                <Link
                  key={similarProduct._id}
                  to={`/product/${similarProduct._id}`}
                  className={`group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800/50 border border-white/10' : 'bg-white/70 border border-gray-200'
                  }`}
                >
                  <div className={`h-32 overflow-hidden bg-gradient-to-br ${getCategoryGradient(similarProduct.category)}`}>
                    {similarProduct.image ? (
                      <img
                        src={similarProduct.image}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full flex items-center justify-center" style={{ display: !similarProduct.image ? 'flex' : 'none' }}>
                      <span className="text-3xl">{getCategoryEmoji(similarProduct.category)}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white capitalize text-sm mb-1 truncate">{similarProduct.name}</h3>
                    <p className="text-primary-600 dark:text-primary-400 font-bold text-sm">₹{similarProduct.price}/{similarProduct.unit}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  to={`/product/${relatedProduct._id}`}
                  className={`group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800/50 border border-white/10' : 'bg-white/70 border border-gray-200'
                  }`}
                >
                  <div className={`h-48 overflow-hidden bg-gradient-to-br ${getCategoryGradient(relatedProduct.category)}`}>
                    {relatedProduct.image ? (
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full flex items-center justify-center" style={{ display: !relatedProduct.image ? 'flex' : 'none' }}>
                      <span className="text-4xl">{getCategoryEmoji(relatedProduct.category)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white capitalize mb-2">{relatedProduct.name}</h3>
                    <p className="text-primary-600 dark:text-primary-400 font-bold">₹{relatedProduct.price}/{relatedProduct.unit}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Seller Information */}
        <div className={`rounded-3xl p-8 shadow-xl mb-8 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-gray-200'}`}>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Seller Information</h2>
          <div className="flex items-start space-x-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(product.category)} text-4xl`}>
              🏪
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Pinqoza Official</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Quality products delivered to your doorstep.</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="text-green-500 mr-2">✓</span>
                  Verified Seller
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="text-green-500 mr-2">✓</span>
                  98% Positive Rating
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="text-green-500 mr-2">✓</span>
                  Fast Delivery
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
            <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Share Product</h3>
                <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="flex flex-col items-center p-4 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.365.195 1.88.121.574-.091 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-xs">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex flex-col items-center p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex flex-col items-center p-4 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-xs">X</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span className="text-xs">Copy Link</span>
                </button>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{window.location.href}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSubscriptionModal(false)}>
            <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Setup Subscription</h3>
                <button onClick={() => setShowSubscriptionModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  ✕
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Frequency</label>
                  <select
                    value={subscriptionFrequency}
                    onChange={(e) => setSubscriptionFrequency(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity per delivery</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    defaultValue={1}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className={`p-4 rounded-xl mb-6 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">You save:</span>
                  <span className="text-green-600 dark:text-green-400 font-bold">15%</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Price per delivery:</span>
                  <span className="text-gray-800 dark:text-white font-bold">₹{(product.price * 0.85).toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleSubscribe}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-secondary-600 transition-all"
              >
                Create Subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Image Modal with Zoom */}
    {showImageModal && (
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowImageModal(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShowImageModal(false);
            setZoomLevel(1);
          }
          if (e.key === '+') handleZoomIn();
          if (e.key === '-') handleZoomOut();
        }}
        tabIndex={0}
      >
        {/* Zoom Controls */}
        <div className="absolute top-20 left-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-md backdrop-blur-sm border border-white/20 hover:scale-110 active:scale-95"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-md backdrop-blur-sm border border-white/20 hover:scale-110 active:scale-95"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={handleResetZoom}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-sm border border-white/20 hover:scale-110 active:scale-95"
            title="Reset Zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setShowImageModal(false);
            setZoomLevel(1);
          }}
          className="absolute top-20 right-4 z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-red-500/80 backdrop-blur-sm shadow-lg"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
          {Math.round(zoomLevel * 100)}%
        </div>

        {/* Image Container */}
        <div 
          className={`relative w-[90vw] md:w-[80vw] h-[70vh] md:h-[75vh] flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(product.category)} rounded-3xl shadow-2xl border-2 border-white/20 backdrop-blur-xl overflow-hidden`}
          onWheel={(e) => {
            e.preventDefault();
            if (e.deltaY < 0) handleZoomIn();
            else handleZoomOut();
          }}
        >
          {productImages && productImages.length > 0 && productImages[selectedImage] ? (
            <img
              src={productImages[selectedImage]}
              alt={product.name}
              className="max-w-[75%] max-h-[75%] object-contain transition-transform duration-300 cursor-move"
              style={{ 
                transform: `scale(${zoomLevel})`,
                maxWidth: zoomLevel > 1 ? '85%' : '75%',
                maxHeight: zoomLevel > 1 ? '85%' : '75%'
              }}
              draggable={false}
              onError={(e) => {
                console.error('Image failed to load in modal:', productImages[selectedImage]);
                e.target.style.display = 'none';
                e.target.parentElement.querySelector('.modal-fallback-emoji').style.display = 'flex';
              }}
            />
          ) : null}
          <div className="modal-fallback-emoji w-full h-full flex items-center justify-center absolute inset-0 text-9xl" style={{ display: (!productImages || productImages.length === 0 || !productImages[selectedImage]) ? 'flex' : 'none' }}>
            {getCategoryEmoji(product.category)}
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {productImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === idx
                    ? 'border-white scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
              >
                <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {productImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : productImages.length - 1))}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImage(prev => (prev < productImages.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    )}
    </>
  );
};

export default ProductDetail;
