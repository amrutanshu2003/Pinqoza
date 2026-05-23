import React, { useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const ProductRating = ({ 
  productId, 
  initialRating = 0, 
  initialReviews = [], 
  onRatingChange,
  onReviewSubmit,
  readonly = false,
  showReviews = true
}) => {
  const { isDarkMode } = useTheme();
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (reviews.length > 0) {
      const total = reviews.reduce((sum, review) => sum + review.rating, 0);
      setAverageRating(total / reviews.length);
    } else {
      setAverageRating(rating);
    }
  }, [reviews, rating]);

  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(ratingValue);
          const isHalfFilled = star === Math.ceil(ratingValue) && ratingValue % 1 !== 0;
          const isEmpty = !isFilled && !isHalfFilled;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && handleRatingClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`transition-all duration-200 ${interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
            >
              {isFilled ? (
                <FaStar className={`w-5 h-5 ${interactive ? 'text-yellow-400' : 'text-yellow-500'}`} />
              ) : isHalfFilled ? (
                <FaStarHalfAlt className={`w-5 h-5 ${interactive ? 'text-yellow-400' : 'text-yellow-500'}`} />
              ) : (
                <FaRegStar 
                  className={`w-5 h-5 ${
                    interactive && star <= hoverRating 
                      ? 'text-yellow-400' 
                      : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                  }`} 
                />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const handleRatingClick = (newRating) => {
    if (!readonly) {
      setRating(newRating);
      setNewReview(prev => ({ ...prev, rating: newRating }));
      if (onRatingChange) {
        onRatingChange(newRating);
      }
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (newReview.rating > 0 && newReview.comment.trim()) {
      const review = {
        id: Date.now(),
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString(),
        user: 'Current User' // In a real app, this would come from user context
      };
      
      setReviews(prev => [review, ...prev]);
      if (onReviewSubmit) {
        onReviewSubmit(review);
      }
      
      setNewReview({ rating: 0, comment: '' });
      setShowReviewForm(false);
    }
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Rating Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {renderStars(averageRating)}
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {averageRating.toFixed(1)}
          </span>
        </div>
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {/* Interactive Rating (for logged-in users) */}
      {!readonly && (
        <div className="space-y-2">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Rate this product:
          </p>
          {renderStars(rating, true)}
        </div>
      )}

      {/* Add Review Button */}
      {!readonly && (
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showReviewForm ? 'Cancel' : 'Write a Review'}
        </button>
      )}

      {/* Review Form */}
      {showReviewForm && !readonly && (
        <form onSubmit={handleReviewSubmit} className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Your Rating
              </label>
              {renderStars(newReview.rating, true)}
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Your Review
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this product..."
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <button
              type="submit"
              disabled={newReview.rating === 0 || !newReview.comment.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                newReview.rating > 0 && newReview.comment.trim()
                  ? isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  : isDarkMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Review
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {showReviews && reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Customer Reviews
          </h3>
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {review.user.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {review.user}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(review.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* No Reviews */}
      {showReviews && reviews.length === 0 && (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      )}
    </div>
  );
};

export default ProductRating;
