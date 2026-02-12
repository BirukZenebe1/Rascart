import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './Pages/HomePage';
import ShopPage from './Pages/ShopPage';
import ProductDetailPage from './Pages/ProductDetailPage';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';
import CartPage from './Pages/CartPage';
import ProfilePage from './Pages/ProfilePage';
import SellerDashboard from './Pages/Seller/SellerDashboard';
import AddProductPage from './Pages/Seller/AddProductPage';
import EditProductPage from './Pages/Seller/EditProductPage';
import SellerProductsPage from './Pages/Seller/SellerProductsPage';
import SellerRoute from './components/SellerRoute';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';
import AboutPage from './Pages/AboutPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import StyleResultsPage from './Pages/StyleResultsPage';
import StyleQuestionnaire from './components/StyleQuestionnaire';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={
              <PrivateRoute>
                <ShopPage />
              </PrivateRoute>
            } />
            <Route path="/product/:id" element={
              <PrivateRoute>
                <ProductDetailPage />
              </PrivateRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/style-questionnaire" element={
              <PrivateRoute>
                <StyleQuestionnaire />
              </PrivateRoute>
            } />
            <Route path="/style-results" element={
              <PrivateRoute>
                <StyleResultsPage />
              </PrivateRoute>
            } />
            
            {/* Buyer Routes */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Seller Routes (Protected) */}
            <Route path="/seller/dashboard" element={
              <SellerRoute>
                <SellerDashboard />
              </SellerRoute>
            } />
            <Route path="/seller/products" element={
              <SellerRoute>
                <SellerProductsPage />
              </SellerRoute>
            } />
            <Route path="/seller/products/add" element={
              <SellerRoute>
                <AddProductPage />
              </SellerRoute>
            } />
            <Route path="/seller/products/edit/:id" element={
              <SellerRoute>
                <EditProductPage />
              </SellerRoute>
            } />
            <Route path="/seller/profile" element={
              <SellerRoute>
                <ProfilePage />
              </SellerRoute>
            } />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
