import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import { getFeaturedProducts, getProductCategories } from '../services/api';

import { isAuthenticated } from '../util/auth';



const UltraModernHome = () => {

  const [featuredProducts, setFeaturedProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {

    fetchData();

    

    // Auto-rotate slides

    const interval = setInterval(() => {

      setCurrentSlide((prev) => (prev + 1) % 3);

    }, 5000);

    

    return () => clearInterval(interval);

  }, []);



  const fetchData = async () => {

    try {

      setLoading(true);

      const [featuredRes, categoriesRes] = await Promise.all([

        getFeaturedProducts(),

        getProductCategories()

      ]);

      setFeaturedProducts(featuredRes.data);

      setCategories(categoriesRes.data);

    } catch (error) {

      console.error('Error fetching data:', error);

    } finally {

      setLoading(false);

    }

  };



  const userAuthenticated = isAuthenticated();

  const categoryUI = {
    groceries: { label: 'Groceries', emoji: '\uD83D\uDED2', gradient: 'from-emerald-500 to-teal-500' },
    fashion: { label: 'Fashion', emoji: '\uD83D\uDC55', gradient: 'from-pink-500 to-rose-500' },
    electronics: { label: 'Electronics', emoji: '\uD83D\uDCF1', gradient: 'from-blue-600 to-cyan-500' },
    home: { label: 'Home', emoji: '\uD83C\uDFE0', gradient: 'from-amber-500 to-orange-500' },
    beauty: { label: 'Beauty', emoji: '\uD83E\uDDF4', gradient: 'from-fuchsia-500 to-purple-500' },
    accessories: { label: 'Accessories', emoji: '\uD83D\uDC5C', gradient: 'from-indigo-500 to-violet-500' },
    sweets: { label: 'Sweets', emoji: '\uD83C\uDF6C', gradient: 'from-purple-600 to-pink-500' },
    cake: { label: 'Cake', emoji: '\uD83C\uDF70', gradient: 'from-green-500 to-emerald-500' },
    other: { label: 'More', emoji: '\uD83D\uDECD\uFE0F', gradient: 'from-slate-600 to-slate-800' }
  };



  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-black dark:to-purple-900">

        <div className="relative">

          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 border-b-transparent rounded-full animate-spin animation-delay-150"></div>

        </div>

      </div>

    );

  }



  const slides = [

    {

      title: "Mega Deals",
      subtitle: "Shop Everything",
      description: "Groceries, fashion, electronics, home & more - all in one place",
      cta: "Start Shopping",
      link: "/products",
      gradient: "from-blue-600 to-cyan-600"

    },

    {

      title: "Daily Essentials",
      subtitle: "Groceries & Home",
      description: "Stock up on must-haves with fast doorstep delivery",
      cta: "Shop Essentials",
      link: "/products?category=groceries",
      gradient: "from-orange-500 to-red-500"

    },

    {

      title: "Trending Picks",
      subtitle: "Fashion & Tech",
      description: "New arrivals and bestsellers curated for you",
      cta: "Explore Trending",
      link: "/products?sort=rating_desc",
      gradient: "from-yellow-400 to-orange-500"

    }

  ];



  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-black">

      

      {/* Ultra Modern Hero Section */}

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Animated Background */}

        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">

          <div className="absolute inset-0 bg-black/10"></div>

          

          {/* Floating Milk Drops */}

          <div className="absolute inset-0">

            {[...Array(15)].map((_, i) => (

              <div

                key={i}

                className="absolute w-3 h-3 bg-white/20 rounded-full animate-bounce"

                style={{

                  left: `${Math.random() * 100}%`,

                  top: `${Math.random() * 100}%`,

                  animationDelay: `${Math.random() * 5}s`,

                  animationDuration: `${3 + Math.random() * 4}s`

                }}

              ></div>

            ))}

          </div>

          

          {/* Geometric Shapes */}

          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 backdrop-blur-lg rounded-full animate-float"></div>

          <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-300/20 backdrop-blur-lg rounded-full animate-float animation-delay-2"></div>

          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-300/20 backdrop-blur-lg rounded-full animate-float animation-delay-4"></div>

        </div>



        {/* Hero Content */}

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">

          {/* Animated Milk Bottle */}

          <div className="mb-8">

            <div className="inline-block relative">

              <div className="w-24 h-24 relative">

                {/* Glow Effect */}

                <div className="absolute inset-0 bg-white/30 backdrop-blur-xl rounded-3xl animate-pulse"></div>

                

                {/* Main Bottle */}

                <div className="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-3xl flex items-center justify-center transform hover:scale-110 transition-transform duration-500 shadow-2xl">

                  <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24">

                    <path d="M7 2v2h1v14a4 4 0 004 4h0a4 4 0 004-4V4h1V2H7zm2 2h6v14a2 2 0 01-2 2h0a2 2 0 01-2-2V4z"/>

                    <path d="M9 6h6v2H9z" opacity="0.3"/>

                  </svg>

                </div>

                

                {/* Animated Milk Drops */}

                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-bounce">

                  <div className="w-full h-full bg-blue-500 rounded-full animate-ping"></div>

                </div>

                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>

              </div>

            </div>

          </div>



          {/* Dynamic Sliding Text */}

          <div className="mb-8 h-20 overflow-hidden">

            <div className="transition-transform duration-500 ease-in-out" style={{ transform: `translateY(-${currentSlide * 80}px)` }}>

              {slides.map((slide, index) => (

                <div key={index} className="h-20 flex items-center justify-center">

                  <h1 className="text-5xl md:text-7xl font-bold text-white">

                    <span className={`bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>

                      {slide.title}

                    </span>

                  </h1>

                </div>

              ))}

            </div>

          </div>

          

          <div className="mb-8">

            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">

              {slides[currentSlide].description}

            </p>

          </div>



          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">

            <Link 

              to={slides[currentSlide].link || "/products"} 

              className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-2xl"

            >

              {slides[currentSlide].cta}

            </Link>

            {!userAuthenticated && (

              <Link 

                to="/register" 

                className="px-8 py-4 border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300"

              >

                Get Started

              </Link>

            )}

          </div>



          {/* Slide Indicators */}

          <div className="flex justify-center space-x-2">

            {slides.map((_, index) => (

              <button

                key={index}

                onClick={() => setCurrentSlide(index)}

                className={`w-3 h-3 rounded-full transition-all duration-300 ${

                  currentSlide === index 

                    ? 'bg-white w-8' 

                    : 'bg-white/50 hover:bg-white/70'

                }`}

              />

            ))}

          </div>

        </div>

      </section>



      {/* Modern Features Grid */}

      <section className="py-20 px-4">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">

              Why Choose Pinqoza?

            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-300">

              Experience the difference with curated products

            </p>

          </div>



          <div className="grid md:grid-cols-3 gap-8">

            {[

              {

                icon: 'â°',

                title: 'Fast Delivery',

                description: 'Get your essentials delivered quickly and reliably',

                color: 'from-blue-500 to-cyan-500'

              },

              {

                icon: 'âœ¨',

                title: 'Verified Sellers',

                description: 'Shop confidently with quality checks and trusted partners',

                color: 'from-green-500 to-emerald-500'

              },

              {

                icon: 'ðŸš€',

                title: 'Quick Delivery',

                description: 'Fast delivery to your doorstep within hours',

                color: 'from-purple-500 to-pink-500'

              }

            ].map((feature, index) => (

              <div

                key={index}

                className="group relative p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"

              >

                {/* Glow Effect */}

                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}></div>

                

                <div className="relative">

                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300`}>

                    <span className="text-2xl">{feature.icon}</span>

                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">

                    {feature.title}

                  </h3>

                  <p className="text-gray-600 dark:text-gray-300">

                    {feature.description}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>



      {/* Trending Products */}

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">

              Trending Now

            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-300">

              Discover our most popular products

            </p>

          </div>



          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {featuredProducts.map((product, index) => (

              <div

                key={product._id}

                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"

              >

                {/* Product Image */}

                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">

                  {product.image ? (

                    <img 

                      src={product.image} 

                      alt={product.name} 

                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"

                    />

                  ) : (

                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-xl flex items-center justify-center">

                      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">

                        <path d="M7 2v2h1v14a4 4 0 004 4h0a4 4 0 004-4V4h1V2H7zm2 2h6v14a2 2 0 01-2 2h0a2 2 0 01-2-2V4z"/>

                      </svg>

                    </div>

                  )}

                  

                  {/* Quick View Badge */}

                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">

                    Quick View

                  </div>

                </div>



                {/* Product Info */}

                <div className="p-6">

                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">

                    {product.name}

                  </h3>

                  <div className="flex items-center justify-between mb-4">

                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">

                      â‚¹{product.price}

                    </span>

                    <span className="text-sm text-gray-500 dark:text-gray-400">

                      /{product.unit}

                    </span>

                  </div>

                  

                  <Link

                    to={`/products/${product._id}`}

                    className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-center hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"

                  >

                    View Details

                  </Link>

                </div>

              </div>

            ))}

          </div>



          <div className="text-center mt-12">

            <Link 

              to="/products" 

              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-xl"

            >

              View All Products

            </Link>

          </div>

        </div>

      </section>



      {/* Categories with Modern Cards */}

      <section className="py-20 px-4">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">

              Shop by Category

            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-300">

              Browse our wide range of categories

            </p>

          </div>



          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => {
              const meta = categoryUI[category] || categoryUI.other;
              const gradient =
                categoryUI[category]?.gradient ||
                (index % 3 === 0 ? 'from-blue-500 to-cyan-500' : index % 3 === 1 ? 'from-purple-500 to-pink-500' : 'from-green-500 to-emerald-500');

              return (
                <Link
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`}></div>

                  <div className="relative p-8 text-white">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl">{meta.emoji}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 capitalize">{meta.label}</h3>
                    <p className="text-white/90 mb-4">
                      Explore deals in {meta.label}
                    </p>

                    <div className="inline-flex items-center gap-2 font-semibold">
                      Browse
                      <span className="transform group-hover:translate-x-1 transition-transform duration-300">{'\u2192'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}

          </div>

        </div>

      </section>



      {/* Modern CTA Section */}

      <section className="py-20 px-4">

        <div className="max-w-4xl mx-auto">

          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center shadow-2xl">

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">

              Ready to start shopping?

            </h2>

            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">

              Join thousands of satisfied customers who trust Pinqoza for their daily needs

            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">

              <Link 

                to="/register" 

                className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-300"

              >

                Get Started Today

              </Link>

              <Link 

                to="/products" 

                className="px-8 py-4 border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300"

              >

                Browse Products

              </Link>

            </div>

          </div>

        </div>

      </section>



    </div>

  );

};



export default UltraModernHome;

