# Frontend + Backend Integration Guide

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
# Backend sẽ chạy trên http://localhost:3001
```

### 2. Frontend Setup  
```bash
cd frontend
npm install
npm run dev  
# Frontend sẽ chạy trên http://localhost:5173
```

### 3. Environment Configuration

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_USE_REAL_API=true
REACT_APP_ENV=development
```

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/skincare-app
OCR_SECRET_KEY=your_ocr_secret_key
OCR_API_URL=your_ocr_api_url
PORT=3001
```

## API Integration Status

### ✅ Connected APIs
- **Product Analysis**: `POST /api/product-analyze/upload`
  - Upload front & back images
  - OCR text extraction
  - Ingredient analysis
  - Product info extraction

### 🔄 Available Backend APIs
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/products/skin-type` - Get products by skin type
- `GET /api/products/uv` - Get UV-based recommendations
- `GET /api/routines` - Get routine recommendations
- `POST /api/users` - User management
- `GET /api/weather` - Weather-based recommendations

### 🚧 Frontend Integration Status
- ✅ Product Analysis connected to backend
- ⏳ Routine Recommendations (next)
- ⏳ Product Search & Filtering
- ⏳ User Profile & Preferences
- ⏳ Weather Integration

## Testing the Integration

### 1. Test Product Analysis
1. Mở http://localhost:5173/product
2. Upload ảnh front và back của sản phẩm skincare
3. Click "Analyze Product" 
4. Check Network tab để xem API calls
5. Kết quả sẽ hiển thị từ backend hoặc fallback to mock data

### 2. API Mode Toggle
- **Real API Mode**: Gọi backend thật, cần backend running
- **Demo Mode**: Dùng mock data, không cần backend

### 3. Error Handling
- Nếu backend không available → fallback to mock data
- Error messages hiển thị trong UI
- Console logs chi tiết để debug

## Backend Response Format

### Product Analysis Response
```json
{
  "status": "success",
  "data": {
    "product": {
      "product_name": "Product Name",
      "brand": "Brand Name", 
      "category": "Serum",
      "benefits": ["benefit1", "benefit2"]
    },
    "ingredients": [
      {
        "name": "Vitamin C",
        "concentration": "15%",
        "safety_level": "low",
        "description": "...",
        "benefits": ["brightening"],
        "safety_description": "Safe for most skin types"
      }
    ]
  }
}
```

## Next Steps

1. **Routine Integration**: Connect routine-recommendations với backend
2. **Product Search**: Wire product listing/filtering APIs  
3. **User Context**: Add user preferences & skin profile
4. **Error Handling**: Improve error UX và retry logic
5. **Performance**: Add loading states và caching

## Troubleshooting

### Common Issues
1. **CORS Error**: Check backend CORS config
2. **Network Error**: Verify backend is running on port 3001
3. **Upload Error**: Check file size limits và image formats
4. **Mock Data**: Toggle API mode if backend unavailable

### Debug Commands
```bash
# Check backend is running
curl http://localhost:3001/

# Test product analysis API
curl -X POST http://localhost:3001/api/product-analyze/upload \
  -F "frontImage=@front.jpg" \
  -F "backImage=@back.jpg"
```