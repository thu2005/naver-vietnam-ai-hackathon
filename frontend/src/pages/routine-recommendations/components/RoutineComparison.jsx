import React from "react";
import Icon from "../../../components/AppIcon";

const RoutineComparison = ({ routineType, priceRange }) => {
  const getComparisonData = () => {
    const baseData = {
      minimal: {
        steps: 3 - 5,
        time: "5-8 phút",
        difficulty: "Dễ dàng",
        suitability: "Người bận rộn, mới bắt đầu",
        results: "2-4 tuần",
        icon: "Zap",
        color: "text-green-600",
      },
      comprehensive: {
        steps: 7 - 10,
        time: "15-25 phút",
        difficulty: "Trung bình",
        suitability: "Có kinh nghiệm, thời gian rảnh",
        results: "1-2 tuần",
        icon: "Target",
        color: "text-blue-600",
      },
    };

    const priceData = {
      low: {
        budget: "100K - 500K VNĐ",
        quality: "Tốt",
        brands: "Local, drugstore",
      },
      medium: {
        budget: "500K - 1.5M VNĐ",
        quality: "Rất tốt",
        brands: "Mid-range, K-beauty",
      },
      high: {
        budget: "1.5M+ VNĐ",
        quality: "Xuất sắc",
        brands: "Premium, luxury",
      },
    };

    return {
      routine: baseData?.[routineType] || baseData?.minimal,
      price: priceData?.[priceRange] || priceData?.medium,
    };
  };

  const data = getComparisonData();

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Icon name="BarChart3" size={20} color="white" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Tổng quan quy trình được chọn
          </h3>
          <p className="text-sm text-muted-foreground font-caption">
            Thông tin chi tiết về lựa chọn của bạn
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Routine Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Icon
              name={data?.routine?.icon}
              size={20}
              className={data?.routine?.color}
            />
            <h4 className="font-medium text-foreground">Thông tin quy trình</h4>
          </div>

          <div className="space-y-3 pl-8">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Số bước:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.steps} bước
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Thời gian:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Độ khó:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.difficulty}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Phù hợp:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.suitability}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Thấy kết quả:
              </span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.results}
              </span>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Icon name="DollarSign" size={20} className="text-green-600" />
            <h4 className="font-medium text-foreground">Thông tin ngân sách</h4>
          </div>

          <div className="space-y-3 pl-8">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ngân sách:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.price?.budget}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Chất lượng:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.price?.quality}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Thương hiệu:
              </span>
              <span className="text-sm font-medium text-foreground">
                {data?.price?.brands}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-start space-x-3 p-4 bg-blue-50/20 rounded-lg">
          <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              Lưu ý quan trọng:
            </p>
            <p>
              Quy trình skincare hiệu quả nhất là quy trình bạn có thể duy trì
              lâu dài. Hãy bắt đầu từ từ và điều chỉnh theo phản ứng của da.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineComparison;
