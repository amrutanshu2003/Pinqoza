import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const RecipeCollection = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const recipes = [
    {
      id: 1,
      name: 'Mango Lassi',
      description: 'Refreshing summer drink with fresh mango and creamy yogurt',
      emoji: '🥭',
      time: '10 mins',
      difficulty: 'Easy',
      difficultyColor: 'green',
      badge: 'POPULAR',
      badgeColor: 'from-green-500 to-emerald-500',
      gradient: 'from-yellow-400 via-orange-400 to-yellow-500',
      ingredients: ['Fresh Milk', 'Yogurt', 'Mango', 'Honey'],
      category: 'all',
      instructions: [
        'Blend fresh mango with yogurt and milk',
        'Add honey to taste',
        'Serve chilled with ice cubes',
        'Garnish with saffron strands'
      ]
    },
    {
      id: 2,
      name: 'Paneer Butter Masala',
      description: 'Creamy and rich curry with soft paneer cubes in tomato-based gravy',
      emoji: '🍛',
      time: '30 mins',
      difficulty: 'Medium',
      difficultyColor: 'yellow',
      badge: 'TRENDING',
      badgeColor: 'from-orange-500 to-red-500',
      gradient: 'from-red-400 via-orange-400 to-red-500',
      ingredients: ['Fresh Paneer', 'Butter', 'Cream', 'Tomatoes'],
      category: 'traditional',
      instructions: [
        'Sauté onions and tomatoes in butter',
        'Add spices and cream for the gravy',
        'Add paneer cubes and simmer',
        'Garnish with fresh coriander'
      ]
    },
    {
      id: 3,
      name: 'Masala Doodh',
      description: 'Warm and aromatic spiced milk perfect for winter evenings',
      emoji: '☕',
      time: '15 mins',
      difficulty: 'Easy',
      difficultyColor: 'green',
      badge: 'TRADITIONAL',
      badgeColor: 'from-amber-500 to-yellow-500',
      gradient: 'from-yellow-300 via-amber-300 to-yellow-400',
      ingredients: ['Fresh Milk', 'Cardamom', 'Saffron', 'Nuts'],
      category: 'traditional',
      instructions: [
        'Heat milk with cardamom and saffron',
        'Add sugar to taste',
        'Simmer for 5-10 minutes',
        'Serve hot with chopped nuts'
      ]
    },
    {
      id: 4,
      name: 'Fruit Smoothie Bowl',
      description: 'Nutritious breakfast bowl with mixed fruits and yogurt',
      emoji: '🥣',
      time: '5 mins',
      difficulty: 'Easy',
      difficultyColor: 'green',
      badge: 'HEALTHY',
      badgeColor: 'from-pink-500 to-purple-500',
      gradient: 'from-pink-400 via-purple-400 to-pink-500',
      ingredients: ['Yogurt', 'Mixed Fruits', 'Honey', 'Granola'],
      category: 'healthy',
      instructions: [
        'Blend yogurt with mixed fruits',
        'Pour into a bowl',
        'Top with granola and honey',
        'Add fresh fruit slices'
      ]
    },
    {
      id: 5,
      name: 'Gajar Ka Halwa',
      description: 'Traditional Indian sweet dessert with carrots, milk and nuts',
      emoji: '🥕',
      time: '45 mins',
      difficulty: 'Medium',
      difficultyColor: 'yellow',
      badge: 'SWEET',
      badgeColor: 'from-red-500 to-orange-500',
      gradient: 'from-orange-400 via-red-400 to-orange-500',
      ingredients: ['Carrots', 'Milk', 'Ghee', 'Sugar'],
      category: 'desserts',
      instructions: [
        'Grate carrots and cook in ghee',
        'Add milk and simmer until carrots are soft',
        'Add sugar and cook until thick',
        'Garnish with nuts and serve warm'
      ]
    },
    {
      id: 6,
      name: 'Grilled Cheese Sandwich',
      description: 'Classic comfort food with melted cheese and toasted bread',
      emoji: '🥪',
      time: '5 mins',
      difficulty: 'Easy',
      difficultyColor: 'green',
      badge: 'QUICK',
      badgeColor: 'from-yellow-500 to-amber-500',
      gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      ingredients: ['Cheese', 'Butter', 'Bread', 'Herbs'],
      category: 'all',
      instructions: [
        'Butter bread slices on both sides',
        'Place cheese between bread slices',
        'Grill on medium heat until golden',
        'Cut diagonally and serve hot'
      ]
    }
  ];

  const filteredRecipes = selectedCategory === 'all' 
    ? recipes 
    : recipes.filter(recipe => recipe.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Recipes' },
    { id: 'traditional', label: 'Traditional' },
    { id: 'healthy', label: 'Healthy' },
    { id: 'desserts', label: 'Desserts' }
  ];

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-black dark:via-emerald-900/20 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group mb-6">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                Recipe Collection
              </span>
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Delicious recipes, tips, and shopping guides • Easy to follow • Helpful picks
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <span className="mr-2">👨‍🍳</span>
            {recipes.length} Recipes Available
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 font-medium rounded-full transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-md`
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className="group relative overflow-hidden rounded-3xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-3 shadow-2xl hover:shadow-3xl backdrop-blur-xl"
              style={{
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)' 
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
                border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.15)'
              }}
            >
              {/* Recipe Image */}
              <div className={`relative h-56 bg-gradient-to-br ${recipe.gradient} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700">
                  <span className="text-7xl drop-shadow-2xl">{recipe.emoji}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/40 to-transparent"></div>
                
                {/* Recipe Badge */}
                <div className={`absolute top-4 left-4 bg-gradient-to-r ${recipe.badgeColor} text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm transform hover:scale-110 transition-transform duration-300`}>
                  {recipe.badge}
                </div>
                
                {/* Time Badge */}
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center shadow-lg border border-white/30">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.time}
                </div>
              </div>
              
              {/* Recipe Content */}
              <div className="p-6 relative">
                {/* Decorative line */}
                <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
                
                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'} group-hover:text-green-500 transition-colors duration-300`}>
                  {recipe.name}
                </h3>
                <p className={`text-sm mb-5 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {recipe.description}
                </p>
                
                {/* Ingredients */}
                <div className="mb-5">
                  <h4 className={`font-semibold text-sm mb-3 flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recipe.ingredients.map((ingredient, idx) => (
                      <span 
                        key={idx} 
                        className={`text-xs px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border border-gray-600' 
                            : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Difficulty Level */}
                <div className="flex items-center justify-between mb-5 p-3 rounded-xl bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-gray-700/30 dark:to-gray-600/30">
                  <div className="flex items-center">
                    <span className={`text-xs mr-3 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Difficulty</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            level <= (recipe.difficulty === 'Easy' ? 2 : 3)
                              ? `bg-gradient-to-r from-${recipe.difficultyColor}-400 to-${recipe.difficultyColor}-500 shadow-md`
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-${recipe.difficultyColor}-100 to-${recipe.difficultyColor}-50 text-${recipe.difficultyColor}-700 dark:from-${recipe.difficultyColor}-900/50 dark:to-${recipe.difficultyColor}-800/50 dark:text-${recipe.difficultyColor}-300`}>
                    {recipe.difficulty}
                  </div>
                </div>
                
                {/* View Recipe Button */}
                <button
                  onClick={() => {
                    // For now, just show an alert. In future, can navigate to individual recipe page
                    alert(`Recipe for ${recipe.name}:\n\n${recipe.instructions.join('\n')}`);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 bg-[length:200%_100%] text-white font-semibold rounded-xl hover:bg-[position:100%_0] transform transition-all duration-500 hover:scale-[1.02] hover:shadow-lg shadow-md flex items-center justify-center gap-2"
                >
                  <span>View Recipe</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCollection;
