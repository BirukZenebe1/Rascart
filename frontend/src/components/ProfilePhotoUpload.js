import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, apiUrl } from '../config';
import { MAX_IMAGE_SIZE_BYTES, optimizeImageFile } from '../utils/imageUpload';

function ProfilePhotoUpload({ currentPhoto, onPhotoUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhoto);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(currentPhoto);
  }, [currentPhoto]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size before compression
      if (file.size > 8 * 1024 * 1024) {
        alert('Image is too large. Please use an image smaller than 8MB.');
        return;
      }

      try {
        const optimized = await optimizeImageFile(file, 800, 0.85);
        if (!optimized || optimized.length > (MAX_IMAGE_SIZE_BYTES * 1.45)) {
          alert('Image is still too large after optimization. Please choose a smaller image.');
          return;
        }
        setPreview(optimized);
        uploadImage(optimized);
      } catch (error) {
        alert('Failed to process image');
      }
    }
  };

  const uploadImage = async (base64Image) => {
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        apiUrl('/api/auth/profile/photo'),
        { image: base64Image },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.profile_photo) {
        onPhotoUpdate(response.data.profile_photo);
        alert('Profile photo updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload image');
      setPreview(currentPhoto); // Reset to original
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(apiUrl('/api/auth/profile/photo'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPreview(null);
      onPhotoUpdate(null);
      alert('Profile photo removed successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Profile Photo Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-cyan-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
          {preview ? (
            <img
              src={preview.startsWith('http') || preview.startsWith('data:')
                ? preview
                : `${API_BASE_URL || ''}/api/auth${preview}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{localStorage.getItem('username')?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Upload Button Overlay */}
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg hover:bg-cyan-700 disabled:opacity-50"
          title="Change photo"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="text-sm text-cyan-700 hover:text-cyan-900 disabled:opacity-50 font-semibold"
        >
          {preview ? 'Change Photo' : 'Upload Photo'}
        </button>
        {preview && (
          <>
            <span className="text-gray-400">|</span>
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Remove
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Max optimized upload: 3MB. Formats: JPG, PNG, GIF, WEBP
      </p>
    </div>
  );
}

export default ProfilePhotoUpload;
