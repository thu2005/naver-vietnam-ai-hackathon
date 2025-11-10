import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import FilterControls from "./components/FilterControls";
import RoutineCard from "./components/RoutineCard";
import ProductModal from "./components/ProductModal";
import RoutineComparison from "./components/RoutineComparison";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

const RoutineRecommendations = () => {
  const [routineType, setRoutineType] = useState("minimal");
  const [priceRange, setPriceRange] = useState("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Mock routine data
  const routineData = {
    minimal: {
      morning: [
        {
          id: 1,
          category: "Sữa rửa mặt nhẹ nhàng",
          description: "Làm sạch da mà không làm khô",
          timing: "1-2 phút",
          purpose: "Làm sạch",
        },
        {
          id: 2,
          category: "Kem chống nắng",
          description: "Bảo vệ da khỏi tia UV",
          timing: "30 giây",
          purpose: "Bảo vệ",
        },
        {
          id: 3,
          category: "Kem dưỡng ẩm",
          description: "Cung cấp độ ẩm cần thiết",
          timing: "1 phút",
          purpose: "Dưỡng ẩm",
        },
      ],

      evening: [
        {
          id: 4,
          category: "Sữa rửa mặt sâu",
          description: "Loại bỏ bụi bẩn và makeup",
          timing: "2 phút",
          purpose: "Làm sạch",
        },
        {
          id: 5,
          category: "Serum phục hồi",
          description: "Nuôi dưỡng da ban đêm",
          timing: "30 giây",
          purpose: "Phục hồi",
        },
        {
          id: 6,
          category: "Kem dưỡng đêm",
          description: "Dưỡng ẩm sâu qua đêm",
          timing: "1 phút",
          purpose: "Nuôi dưỡng",
        },
      ],
    },
    comprehensive: {
      morning: [
        {
          id: 1,
          category: "Sữa rửa mặt pH cân bằng",
          description: "Làm sạch nhẹ nhàng, cân bằng pH",
          timing: "2 phút",
          purpose: "Làm sạch",
        },
        {
          id: 2,
          category: "Toner cân bằng",
          description: "Chuẩn bị da cho các bước tiếp theo",
          timing: "30 giây",
          purpose: "Cân bằng",
        },
        {
          id: 3,
          category: "Vitamin C Serum",
          description: "Chống oxy hóa, làm sáng da",
          timing: "1 phút",
          purpose: "Chống lão hóa",
        },
        {
          id: 4,
          category: "Kem dưỡng mắt",
          description: "Chăm sóc vùng mắt nhạy cảm",
          timing: "30 giây",
          purpose: "Chăm sóc đặc biệt",
        },
        {
          id: 5,
          category: "Kem dưỡng ẩm",
          description: "Khóa ẩm và nuôi dưỡng",
          timing: "1 phút",
          purpose: "Dưỡng ẩm",
        },
        {
          id: 6,
          category: "Kem chống nắng SPF 50+",
          description: "Bảo vệ toàn diện khỏi UV",
          timing: "1 phút",
          purpose: "Bảo vệ",
        },
      ],

      evening: [
        {
          id: 7,
          category: "Dầu tẩy trang",
          description: "Loại bỏ makeup và sunscreen",
          timing: "2 phút",
          purpose: "Tẩy trang",
        },
        {
          id: 8,
          category: "Sữa rửa mặt sâu",
          description: "Làm sạch sâu lỗ chân lông",
          timing: "2 phút",
          purpose: "Làm sạch",
        },
        {
          id: 9,
          category: "Tẩy tế bào chết (2-3 lần/tuần)",
          description: "Loại bỏ tế bào chết, làm mịn da",
          timing: "1 phút",
          purpose: "Tẩy tế bào chết",
        },
        {
          id: 10,
          category: "Toner phục hồi",
          description: "Cân bằng và chuẩn bị da",
          timing: "30 giây",
          purpose: "Cân bằng",
        },
        {
          id: 11,
          category: "Serum điều trị",
          description: "Retinol hoặc niacinamide",
          timing: "1 phút",
          purpose: "Điều trị",
        },
        {
          id: 12,
          category: "Kem dưỡng mắt đêm",
          description: "Phục hồi vùng mắt qua đêm",
          timing: "30 giây",
          purpose: "Chăm sóc đặc biệt",
        },
        {
          id: 13,
          category: "Kem dưỡng đêm",
          description: "Nuôi dưỡng và phục hồi sâu",
          timing: "1 phút",
          purpose: "Nuôi dưỡng",
        },
      ],
    },
  };

  // Mock products data
  const mockProducts = {
    "Sữa rửa mặt nhẹ nhàng": [
      {
        id: 1,
        name: "CeraVe Foaming Facial Cleanser",
        brand: "CeraVe",
        price: 320000,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1735286770188-de4c5131589a",
        imageAlt:
          "White bottle of CeraVe foaming facial cleanser with blue label on clean background",
        benefits: ["Không làm khô da", "Chứa ceramides", "Phù hợp da nhạy cảm"],
      },
      {
        id: 2,
        name: "La Roche-Posay Toleriane Caring Wash",
        brand: "La Roche-Posay",
        price: 450000,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1629198726018-604230bdb091",
        imageAlt:
          "Blue and white La Roche-Posay cleanser bottle with minimalist design",
        benefits: ["Dành cho da nhạy cảm", "Không chứa xà phòng", "Làm dịu da"],
      },
      {
        id: 3,
        name: "Neutrogena Ultra Gentle Daily Cleanser",
        brand: "Neutrogena",
        price: 280000,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1695561115616-b4b719f1a242",
        imageAlt:
          "Orange and white Neutrogena cleanser bottle with pump dispenser",
        benefits: [
          "Làm sạch nhẹ nhàng",
          "Không gây kích ứng",
          "Giá cả phải chăng",
        ],
      },
      {
        id: 4,
        name: "Eucerin DermatoCLEAN Mild Cleansing Milk",
        brand: "Eucerin",
        price: 380000,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1689166972543-6ef3bfe2d827",
        imageAlt:
          "White Eucerin cleansing milk bottle with blue accents and professional packaging",
        benefits: ["Sữa rửa mặt dịu nhẹ", "Loại bỏ makeup", "Không làm khô da"],
      },
      {
        id: 5,
        name: "Bioderma Sensibio Gel Moussant",
        brand: "Bioderma",
        price: 420000,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1721280964728-11a67056d4d6",
        imageAlt:
          "Clear Bioderma gel cleanser bottle with pink and white labeling",
        benefits: [
          "Dành cho da nhạy cảm",
          "Công thức gel nhẹ",
          "Không chứa paraben",
        ],
      },
    ],

    "Kem chống nắng": [
      {
        id: 6,
        name: "Biore UV Aqua Rich Watery Essence SPF50+",
        brand: "Biore",
        price: 250000,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1616750819456-5cdee9b85d22",
        imageAlt:
          "Blue Biore sunscreen tube with water droplet design and SPF50+ marking",
        benefits: ["Kết cấu nước", "Thấm nhanh", "Không nhờn rít"],
      },
      {
        id: 7,
        name: "La Roche-Posay Anthelios Ultra Light SPF60",
        brand: "La Roche-Posay",
        price: 580000,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1618332192990-ae0bc9061593",
        imageAlt:
          "White La Roche-Posay sunscreen tube with orange accents and SPF60 label",
        benefits: ["Bảo vệ UVA/UVB", "Chống nước", "Không gây mụn"],
      },
      {
        id: 8,
        name: "Eucerin Sun Face Oil Control SPF60",
        brand: "Eucerin",
        price: 520000,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1618332192990-ae0bc9061593",
        imageAlt:
          "White and orange Eucerin sunscreen bottle with oil control formula labeling",
        benefits: ["Kiểm soát dầu", "Lâu trôi", "Phù hợp da dầu"],
      },
      {
        id: 9,
        name: "Neutrogena Ultra Sheer Dry-Touch SPF55",
        brand: "Neutrogena",
        price: 320000,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1654973552952-d0c98a3e3388",
        imageAlt:
          "Yellow and white Neutrogena sunscreen tube with dry-touch technology branding",
        benefits: ["Khô ráo", "Không để lại vệt trắng", "Chống nước 80 phút"],
      },
      {
        id: 10,
        name: "Avène Fluide Minéral Teinté SPF50+",
        brand: "Avène",
        price: 650000,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1671789407725-5098c410f79e",
        imageAlt:
          "White Avène tinted sunscreen tube with mineral formula and SPF50+ protection",
        benefits: ["Có màu tự nhiên", "100% khoáng chất", "Da nhạy cảm"],
      },
    ],
  };

  // Handle filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [routineType, priceRange]);

  // Handle category click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
    setIsProductsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const products =
        mockProducts?.[category?.category] ||
        mockProducts?.["Sữa rửa mặt nhẹ nhàng"];
      setModalProducts(products);
      setIsProductsLoading(false);
    }, 1000);
  };

  const currentRoutine = routineData?.[routineType] || routineData?.minimal;

  return (
    <>
      <Helmet>
        <title>Gợi ý quy trình chăm sóc da - SkinCare Analyzer</title>
        <meta
          name="description"
          content="Nhận gợi ý quy trình chăm sóc da cá nhân hóa dựa trên loại da và ngân sách của bạn. Từ quy trình tối giản đến toàn diện."
        />
        <meta
          name="keywords"
          content="quy trình skincare, chăm sóc da, gợi ý sản phẩm, routine skincare, skincare việt nam"
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-teal-50/30">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glass">
                <Icon name="Calendar" size={24} color="white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold gradient-text">
                Gợi ý quy trình chăm sóc da
              </h1>
            </div>
            <p className="text-lg text-muted-foreground font-caption max-w-2xl mx-auto">
              Nhận gợi ý quy trình chăm sóc da cá nhân hóa dựa trên lối sống và
              ngân sách của bạn. Từ quy trình tối giản đến toàn diện, chúng tôi
              sẽ giúp bạn xây dựng routine hoàn hảo.
            </p>
          </div>

          {/* Filter Controls */}
          <FilterControls
            routineType={routineType}
            setRoutineType={setRoutineType}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />

          {/* Routine Comparison */}
          {routineType && priceRange && (
            <RoutineComparison
              routineType={routineType}
              priceRange={priceRange}
            />
          )}

          {/* Routine Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <RoutineCard
              title="Quy trình buổi sáng"
              timeOfDay="morning"
              steps={currentRoutine?.morning}
              onCategoryClick={handleCategoryClick}
              isLoading={isLoading}
            />

            <RoutineCard
              title="Quy trình buổi tối"
              timeOfDay="evening"
              steps={currentRoutine?.evening}
              onCategoryClick={handleCategoryClick}
              isLoading={isLoading}
            />
          </div>

          {/* Tips Section */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Icon name="Lightbulb" size={20} color="white" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Mẹo sử dụng quy trình hiệu quả
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-white/10 rounded-lg">
                <Icon name="Clock" size={16} className="text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    Thời gian chờ
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Chờ 2-3 phút giữa các bước để sản phẩm thấm hoàn toàn
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white/10 rounded-lg">
                <Icon
                  name="Droplets"
                  size={16}
                  className="text-teal-600 mt-1"
                />
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    Lượng sản phẩm
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Sử dụng lượng vừa đủ, tránh lãng phí và gây bít tắc lỗ chân
                    lông
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white/10 rounded-lg">
                <Icon
                  name="TrendingUp"
                  size={16}
                  className="text-green-600 mt-1"
                />
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    Kiên trì
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Duy trì ít nhất 4-6 tuần để thấy kết quả rõ rệt
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="glass-card p-8">
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                Cần tư vấn thêm về quy trình?
              </h3>
              <p className="text-muted-foreground font-caption mb-6 max-w-md mx-auto">
                Chatbot AI của chúng tôi sẵn sàng giải đáp mọi thắc mắc về
                skincare và giúp bạn tối ưu hóa quy trình chăm sóc da.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="default"
                  onClick={() => (window.location.href = "/skincare-chatbot")}
                  iconName="MessageCircle"
                  iconPosition="left"
                  iconSize={20}
                >
                  Tư vấn với AI
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/product-analysis")}
                  iconName="Camera"
                  iconPosition="left"
                  iconSize={20}
                >
                  Phân tích sản phẩm
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Product Modal */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={selectedCategory}
          products={modalProducts}
          isLoading={isProductsLoading}
        />
      </div>
    </>
  );
};

export default RoutineRecommendations;
