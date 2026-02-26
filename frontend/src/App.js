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
import CheckoutPage from './Pages/CheckoutPage';
import SellerDashboard from './Pages/Seller/SellerDashboard';
import AddProductPage from './Pages/Seller/AddProductPage';
import EditProductPage from './Pages/Seller/EditProductPage';
import SellerProductsPage from './Pages/Seller/SellerProductsPage';
import SellerRoute from './components/SellerRoute';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';
import AboutPage from './Pages/AboutPage';
import TermsPage from './Pages/TermsPage';
import ForgotPasswordPage from './Pages/ForgotPasswordPage';
import SupportPage from './Pages/SupportPage';
import SellerChatsPage from './Pages/Seller/SellerChatsPage';
import AdminPromoPage from './Pages/AdminPromoPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { LikesProvider } from './context/LikesContext';
import StyleResultsPage from './Pages/StyleResultsPage';
import StyleQuestionnaire from './components/StyleQuestionnaire';
import OrderSuccessPage from './Pages/OrderSuccessPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LikesProvider>
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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/support" element={<SupportPage />} />
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
            <Route path="/checkout" element={
              <PrivateRoute>
                <CheckoutPage />
              </PrivateRoute>
            } />
            <Route path="/order-success" element={
              <PrivateRoute>
                <OrderSuccessPage />
              </PrivateRoute>
            } />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chats" element={
              <PrivateRoute>
                <SellerChatsPage />
              </PrivateRoute>
            } />
            
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
            <Route path="/seller/chats" element={
              <SellerRoute>
                <SellerChatsPage />
              </SellerRoute>
            } />
            <Route path="/admin/promos" element={
              <PrivateRoute>
                <AdminPromoPage />
              </PrivateRoute>
            } />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </LikesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
