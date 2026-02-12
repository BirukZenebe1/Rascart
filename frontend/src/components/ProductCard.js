import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <img 
        src={product.imageUrl} 
        alt={product.name}
        className="w-full h-52 object-cover rounded-xl"
      />
      <div className="mt-4">
        <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
        <p className="text-cyan-700 font-semibold mt-1">${product.price}</p>
        <div className="mt-4">
          <Link 
            to={`/product/${product._id}`}
            className="inline-flex items-center bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
